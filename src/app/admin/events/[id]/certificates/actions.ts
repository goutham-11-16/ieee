'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createApprovalRequest } from '@/lib/actions/approvals'
import { logAction } from '@/lib/actions/audit'

export async function saveTemplate(formData: FormData) {
    const supabase = await createClient()
    const eventId = formData.get('eventId') as string
    const config = formData.get('config') as string
    const file = formData.get('background') as File

    const { data: existing } = await supabase
        .from('certificate_templates')
        .select('id, background_url')
        .eq('event_id', eventId)
        .single()

    let backgroundUrl = existing?.background_url

    if (file && file.size > 0) {
        const fileName = `templates/${eventId}-${Date.now()}.${file.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage
            .from('certificate_templates')
            .upload(fileName, file)

        if (uploadError) return { error: 'Upload failed' }
        backgroundUrl = fileName
    }

    const { error } = await supabase
        .from('certificate_templates')
        .upsert({
            event_id: eventId,
            layout_config: JSON.parse(config),
            background_url: backgroundUrl,
            name: 'Default Template', // Simplified
            updated_at: new Date().toISOString()
        })

    if (error) return { error: error.message }

    revalidatePath(`/admin/events/${eventId}/certificates`)
    return { success: true }
}

export async function lockTemplate(templateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'

    if (isSuperAdmin) {
        // Direct Lock
        const { error } = await supabase.from('certificate_templates').update({ is_locked: true }).eq('id', templateId)

        if (error) return { error: error.message }

        // Log action
        await logAction('LOCK_TEMPLATE', 'certificate_templates', templateId, {})

        revalidatePath('/')
        return { success: true, message: 'Template locked successfully.' }
    } else {
        // Request Approval
        const { createApprovalRequest } = await import('@/lib/actions/approvals')
        const result = await createApprovalRequest(
            'LOCK_TEMPLATE',
            'certificate_templates',
            templateId,
            { is_locked: true }
        )

        if (result.error) return result

        return { success: true, message: 'Lock request submitted for approval.' }
    }
}

export async function generateCertificates(eventId: string) {
    const supabase = await createClient()

    // 1. Get Template
    const { data: template } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_locked', true)
        .single()

    if (!template) return { error: 'Template not found or not locked.' }

    // 2. Get Attendees who have Verified payments
    const { data: attendance } = await supabase
        .from('attendance')
        .select(`
            registration_id,
            registration:registrations (
                id,
                guest_name,
                team_members,
                user:profiles!user_id(full_name),
                event:events(title, date),
                payments(status)
            )
        `)
        .eq('event_id', eventId)

    if (!attendance || attendance.length === 0) return { error: 'No attendees found.' }

    // 3. Generate (In loop - strictly bad for Perf, but ok for MVP)
    let count = 0

    // Load Template Buffer
    const { data: fileData, error: dlError } = await supabase.storage
        .from('certificate_templates')
        .download(template.background_url)

    if (dlError || !fileData) return { error: 'Failed to download template file' }

    const templateArrayBuffer = await fileData.arrayBuffer()
    const layout = template.layout_config as any

    for (const record of attendance) {
        const hasVerifiedPayment = (record.registration as any)?.payments?.some((p: any) => p.status === 'verified')
        if (!hasVerifiedPayment) {
            console.log(`Skipping certificate for ${record.registration_id}: No verified payment.`)
            continue
        }

        const registration = record.registration as any
        const leaderName = registration.guest_name || registration.user?.full_name || 'Guest Participant'

        let teamList: string[] = [leaderName]
        if (registration.team_members && Array.isArray(registration.team_members)) {
            const memberNames = registration.team_members.map((m: any) => m.guestName).filter(Boolean)
            teamList = teamList.concat(memberNames)
        }

        for (const pName of teamList) {
            // Check existing for this specific participant
            const { data: existing } = await supabase
                .from('certificates')
                .select('id')
                .eq('registration_id', record.registration_id)
                .eq('participant_name', pName)
                .single()

            if (existing) continue

            try {
                const pdfDoc = await PDFDocument.load(templateArrayBuffer)
                const pages = pdfDoc.getPages()
                const firstPage = pages[0]
                const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

                const mapField = (field: string, pName: string) => {
                    if (field === 'participant_name') return pName
                    if (field === 'event_name') return registration.event?.title || 'Unknown'
                    if (field === 'date') return registration.event?.date ? new Date(registration.event.date).toLocaleDateString() : 'N/A'
                    return ''
                }

                // Unique Code
                const uniqueCode = crypto.randomUUID().slice(0, 8).toUpperCase()

                // Draw Elements
                layout.elements.forEach((el: any) => {
                    let text = mapField(el.field, pName)
                    if (el.field === 'unique_code') text = uniqueCode

                    if (text) {
                        firstPage.drawText(text, {
                            x: el.x,
                            y: el.y,
                            size: el.size || 12,
                            font: font,
                            color: rgb(0, 0, 0)
                        })
                    }
                })

                const pdfBytes = await pdfDoc.save()

                // Upload
                const fileName = `generated/${uniqueCode}.pdf`
                await supabase.storage
                    .from('certificates')
                    .upload(fileName, Buffer.from(pdfBytes), { contentType: 'application/pdf' })

                // Insert DB
                await supabase.from('certificates').insert({
                    registration_id: record.registration_id,
                    template_id: template.id,
                    unique_code: uniqueCode,
                    file_url: fileName,
                    participant_name: pName
                })

                count++
            } catch (e) {
                console.error('Gen error', e)
            }
        }
    }

    revalidatePath('/')
    return { success: true, count }
}
