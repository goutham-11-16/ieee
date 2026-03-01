'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { generateUUID } from '@/lib/utils'

// Helper function cloned for MVP speed. In production, move to a shared lib.
async function generateSingleCertificate(supabase: any, registrationId: string, participantName: string, eventId: string) {
    const { data: template } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_locked', true)
        .single()

    if (!template) throw new Error('Template not found or not locked.')

    const { data: reg } = await supabase
        .from('registrations')
        .select(`
            id,
            guest_name,
            guest_reg_no,
            user:profiles!user_id(full_name),
            event:events(title, date)
        `)
        .eq('id', registrationId)
        .single()

    if (!reg) throw new Error('Registration not found')

    // Download template
    const { data: fileData, error: dlError } = await supabase.storage
        .from('certificate_templates')
        .download(template.background_url)

    if (dlError || !fileData) throw new Error('Failed to download template file')

    const templateArrayBuffer = await fileData.arrayBuffer()
    const layout = template.layout_config as any
    const elementsArray = Array.isArray(layout) ? layout : (layout?.elements || [])

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

    const uniqueCode = generateUUID().slice(0, 8).toUpperCase()

    const mapField = (tag: string) => {
        if (tag === '{name}') return participantName
        if (tag === '{regno}') return reg.guest_reg_no || 'N/A'
        if (tag === '{eventName}') return reg.event?.title || 'Unknown'
        if (tag === '{date}') return reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'N/A'
        return ''
    }

    const hexToRgb = (hex: string) => {
        hex = hex.replace(/^#/, '')
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
        const num = parseInt(hex, 16)
        return { r: (num >> 16) / 255, g: ((num >> 8) & 255) / 255, b: (num & 255) / 255 }
    }

    elementsArray.forEach((el: any) => {
        let text = mapField(el.tag || el.field)
        if (el.tag === '{uniqueCode}' || el.field === 'unique_code') text = uniqueCode

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

    await supabase.from('certificates').insert({
        registration_id: reg.id,
        template_id: template.id,
        unique_code: uniqueCode,
        file_url: fileName,
        participant_name: participantName
    })
}

export async function resolveAction(exceptionId: string, registrationId: string, action: 'generate' | 'reject') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Check Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'super_admin') {
        return { success: false, error: 'Only Super Admins can force resolve exceptions.' }
    }

    // Get Exception Details
    const { data: exc } = await supabase
        .from('certificate_exceptions')
        .select('*')
        .eq('id', exceptionId)
        .single()

    if (!exc) return { success: false, error: 'Exception record not found' }

    if (action === 'generate') {
        try {
            await generateSingleCertificate(supabase, registrationId, exc.participant_name, exc.event_id)

            await supabase.from('certificate_exceptions').update({
                status: 'resolved_generated',
                resolved_by: user.id,
                resolved_at: new Date().toISOString()
            }).eq('id', exceptionId)

        } catch (e: any) {
            return { success: false, error: e.message }
        }
    } else {
        await supabase.from('certificate_exceptions').update({
            status: 'resolved_rejected',
            resolved_by: user.id,
            resolved_at: new Date().toISOString()
        }).eq('id', exceptionId)
    }

    revalidatePath('/admin/certificates/exceptions')
    return { success: true }
}

