'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentProfile } from '@/lib/auth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { logAction } from '@/lib/actions/audit'
import { generateUUID } from '@/lib/utils'

export async function saveTemplate(eventId: string, backgroundUrl: string, layoutConfig: any[]) {
    const profile = await getCurrentProfile()
    if (!profile || !['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // check if it exists
    const { data: existing } = await supabase
        .from('certificate_templates')
        .select('id, is_locked')
        .eq('event_id', eventId)
        .single()

    if (existing?.is_locked) {
        return { success: false, error: 'Template is locked and cannot be edited.' }
    }

    if (existing) {
        const { error } = await supabase
            .from('certificate_templates')
            .update({
                background_url: backgroundUrl,
                layout_config: layoutConfig,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

        if (error) return { success: false, error: error.message }
    } else {
        const { error } = await supabase
            .from('certificate_templates')
            .insert({
                event_id: eventId,
                background_url: backgroundUrl,
                layout_config: layoutConfig,
                name: 'Default Template'
            })

        if (error) return { success: false, error: error.message }
    }

    revalidatePath(`/admin/certificates/${eventId}`)
    revalidatePath(`/admin/certificates`)
    return { success: true }
}

export async function requestTemplateLock(eventId: string) {
    const profile = await getCurrentProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()

    // Only Super Admins, Admins, and Content Admins can lock instantly.
    // For simplicity based on DB constraints, we'll lock it immediately for them or create an approval_request for others (like event_admin).
    if (['super_admin', 'admin', 'content_admin'].includes(profile.role)) {
        const { error } = await supabase
            .from('certificate_templates')
            .update({ is_locked: true, updated_at: new Date().toISOString() })
            .eq('event_id', eventId)

        if (error) return { success: false, error: error.message }
    } else {
        // Create an Approval Request for the Super Admin
        const { error } = await supabase
            .from('approval_requests')
            .insert({
                requester_id: profile.id,
                action_type: 'LOCK_TEMPLATE',
                entity_table: 'certificate_templates',
                entity_id: eventId, // Can use event_id temporarily for mapping
                new_data: { event_id: eventId }
            })

        if (error) return { success: false, error: 'Could not create lock request: ' + error.message }
    }

    revalidatePath(`/admin/certificates/${eventId}`)
    return { success: true }
}

export async function generateCertificates(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Get Template
    const { data: template } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_locked', true)
        .single()

    if (!template) return { success: false, error: 'Template not found or not locked. Please lock the template first.' }

    // 2. Fetch all Registrations and their Attendance & Payments
    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            guest_name,
            guest_reg_no,
            team_members,
            user:profiles!user_id(full_name),
            event:events(title, date, fees),
            payments(status),
            attendance(id)
        `)
        .eq('event_id', eventId)

    if (!registrations || registrations.length === 0) return { success: false, error: 'No registrations found.' }

    // 3. Create Job Record
    const { data: job, error: jobError } = await supabase
        .from('certificate_jobs')
        .insert({
            event_id: eventId,
            started_by: user.id,
            status: 'processing'
        })
        .select()
        .single()

    if (jobError || !job) return { success: false, error: 'Failed to initialize batch job.' }

    // 4. Segregate Data
    const eligible: any[] = []
    const exceptions: any[] = []

    for (const reg of registrations) {
        const isApprovedRegistration = reg.status === 'approved'
        const hasAttended = reg.attendance && reg.attendance.length > 0

        let leaderName = reg.guest_name || 'Guest Participant';
        if (!reg.guest_name && reg.user) {
            const userObj = Array.isArray(reg.user) ? reg.user[0] : reg.user;
            leaderName = userObj?.full_name || 'Guest Participant';
        }
        let teamList: string[] = [leaderName]
        if (reg.team_members && Array.isArray(reg.team_members)) {
            const memberNames = reg.team_members.map((m: any) => m.guestName).filter(Boolean)
            teamList = teamList.concat(memberNames)
        }

        if (isApprovedRegistration && hasAttended) {
            // All Good
            for (const pName of teamList) {
                eligible.push({ reg, pName })
            }
        } else if (isApprovedRegistration && !hasAttended) {
            exceptions.push({ reg, participant_name: leaderName, reason: 'Approved but Absent' })
        } else if (!isApprovedRegistration && hasAttended) {
            exceptions.push({ reg, participant_name: leaderName, reason: `Attended but Status is ${reg.status}` })
        } else {
            // Neither approved nor attended - we can silently ignore them as they just didn't show up
        }
    }

    // Load Template Buffer exactly once
    let templateArrayBuffer: ArrayBuffer;
    if (template.background_url?.startsWith('http')) {
        const res = await fetch(template.background_url);
        if (!res.ok) {
            await supabase.from('certificate_jobs').update({ status: 'failed' }).eq('id', job.id)
            return { success: false, error: 'Failed to fetch template file from URL' }
        }
        templateArrayBuffer = await res.arrayBuffer();
    } else {
        const { data: fileData, error: dlError } = await supabase.storage
            .from('certificate_templates')
            .download(template.background_url)

        if (dlError || !fileData) {
            await supabase.from('certificate_jobs').update({ status: 'failed' }).eq('id', job.id)
            return { success: false, error: 'Failed to download template file from storage' }
        }
        templateArrayBuffer = await fileData.arrayBuffer()
    }
    const layout = template.layout_config as any
    const elementsArray = Array.isArray(layout) ? layout : (layout?.elements || [])

    let generatedCount = 0

    // 5. Generate Eligible
    for (const item of eligible) {
        const { reg, pName } = item

        // Check existing
        const { data: existing } = await supabase
            .from('certificates')
            .select('id')
            .eq('registration_id', reg.id)
            .eq('participant_name', pName)
            .single()

        if (existing) continue

        try {
            const pdfDoc = await PDFDocument.load(templateArrayBuffer)
            const pages = pdfDoc.getPages()
            const firstPage = pages[0]

            const loadedFonts: Record<string, any> = {
                'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
                'HelveticaBold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
                'HelveticaOblique': await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
                'HelveticaBoldOblique': await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
                'TimesRoman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
                'TimesBold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
                'TimesItalic': await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
                'TimesBoldItalic': await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
                'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
                'CourierBold': await pdfDoc.embedFont(StandardFonts.CourierBold),
                'CourierOblique': await pdfDoc.embedFont(StandardFonts.CourierOblique),
                'CourierBoldOblique': await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
            }

            const mapField = (tag: string, pName: string) => {
                if (tag === '{name}') return pName
                if (tag === '{regno}') return reg.guest_reg_no || 'N/A'
                if (tag === '{eventName}') return reg.event?.title || 'Unknown'
                if (tag === '{date}') return reg.event?.date ? new Date(reg.event.date).toLocaleDateString('en-GB') : 'N/A'
                return ''
            }

            const randomHex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()
            const refNo = `CERT-${randomHex}`
            const uniqueCode = generateUUID().slice(0, 8).toUpperCase()

            const hexToRgb = (hex: string) => {
                hex = hex.replace(/^#/, '')
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
                const num = parseInt(hex, 16)
                return { r: (num >> 16) / 255, g: ((num >> 8) & 255) / 255, b: (num & 255) / 255 }
            }

            elementsArray.forEach((el: any) => {
                let text = mapField(el.tag || el.field, pName)
                if (el.tag === '{uniqueCode}' || el.field === 'unique_code') text = uniqueCode
                if (el.tag === '{refNo}' || el.field === 'ref_no') text = refNo

                if (text) {
                    const { r, g, b } = hexToRgb(el.color || '#000000')
                    firstPage.drawText(text, {
                        x: el.x,
                        y: el.y,
                        size: el.size || 24,
                        font: loadedFonts[el.font] || loadedFonts['Helvetica'],
                        color: rgb(r, g, b)
                    })
                }
            })

            const pdfBytes = await pdfDoc.save()
            const fileName = `generated/${uniqueCode}.pdf`

            await supabase.storage
                .from('certificates')
                .upload(fileName, Buffer.from(pdfBytes), { contentType: 'application/pdf' })

            // Optional Output to Google Drive
            try {
                const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
                if (scriptUrl) {
                    const base64Data = Buffer.from(pdfBytes).toString('base64');
                    const uploadPayload = {
                        base64Data: base64Data,
                        filename: `${pName.replace(/\s+/g, '_')}_${uniqueCode}.pdf`,
                        mimeType: 'application/pdf',
                        eventTitle: reg.event?.title?.trim() || 'Unknown_Event',
                        targetFolder: 'Certificates'
                    };

                    await fetch(scriptUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify(uploadPayload)
                    });
                }
            } catch (e) {
                console.error("Drive upload failed for cert:", e)
            }

            await supabase.from('certificates').insert({
                registration_id: reg.id,
                template_id: template.id,
                unique_code: uniqueCode,
                file_url: fileName,
                participant_name: pName
            })

            generatedCount++
        } catch (e) {
            console.error(`Gen error for ${pName}`, e)
        }
    }

    // 6. Log Exceptions
    for (const exc of exceptions) {
        // Only insert if an exception for this reg doesn't already exist to avoid spamming
        const { data: existingExc } = await supabase
            .from('certificate_exceptions')
            .select('id')
            .eq('registration_id', exc.reg.id)
            .eq('job_id', job.id)
            .single()

        if (!existingExc) {
            await supabase.from('certificate_exceptions').insert({
                job_id: job.id,
                event_id: eventId,
                registration_id: exc.reg.id,
                participant_name: exc.participant_name,
                reason: exc.reason
            })
        }
    }

    // 7. Complete Job (Queue for Approval instead of final Publish if not Super Admin)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'
    const finalStatus = isSuperAdmin ? 'completed' : 'pending_approval'

    await supabase.from('certificate_jobs').update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        total_eligible: eligible.length,
        total_exceptions: exceptions.length,
        total_generated: generatedCount
    }).eq('id', job.id)

    // Log the heavy action
    await logAction('GENERATE_CERTIFICATES', 'certificate_jobs', job.id, {
        eligibleCount: eligible.length,
        generatedCount,
        exceptionsCount: exceptions.length
    })

    if (!isSuperAdmin) {
        const { createApprovalRequest } = await import('@/lib/actions/approvals')
        await createApprovalRequest(
            'GENERATE_CERTIFICATES',
            'certificate_jobs',
            job.id,
            { status: 'completed' }
        )
    }

    revalidatePath('/')
    revalidatePath(`/admin/certificates/${eventId}`)
    revalidatePath(`/admin/certificates`)

    return {
        success: true,
        count: generatedCount,
        exceptions: exceptions.length,
        message: `Generated ${generatedCount} certificates. Found ${exceptions.length} exceptions requiring Super Admin review.`
    }
}
