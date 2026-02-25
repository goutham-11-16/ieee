'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { logAction } from '@/lib/actions/audit'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function markRegistrationAsPaid(registrationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch info
    const { data: reg, error: regError } = await supabase
        .from('registrations')
        .select(`
            *,
            user:profiles!user_id(full_name),
            event:events(id, title, fees)
        `)
        .eq('id', registrationId)
        .single()

    if (regError || !reg) return { error: 'Registration not found' }

    const amount = reg.event?.fees || 0
    const transactionRef = 'MANUAL-' + crypto.randomBytes(4).toString('hex').toUpperCase()

    // 2. Create payment record automatically as 'verified'
    const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
            registration_id: registrationId,
            amount,
            transaction_reference: transactionRef,
            status: 'verified',
            verified_by: user.id,
            verified_at: new Date().toISOString()
        })
        .select()
        .single()

    if (paymentError) return { error: paymentError.message }

    // 3. Generate Receipt PDF
    try {
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([600, 400])
        const { width, height } = page.getSize()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        page.drawText('PAYMENT RECEIPT (IN-PERSON)', { x: 50, y: height - 80, size: 20, font: fontBold, color: rgb(0, 0, 0) })

        const drawField = (label: string, value: string, y: number) => {
            page.drawText(label, { x: 50, y, size: 12, font: fontBold })
            page.drawText(value, { x: 150, y, size: 12, font })
        }

        drawField('Receipt ID:', payment.id.slice(0, 8).toUpperCase(), height - 120)
        drawField('Date:', new Date().toLocaleDateString(), height - 140)
        drawField('Event:', reg.event?.title || 'Unknown Event', height - 180)
        drawField('Payer:', reg.guest_name || reg.user?.full_name || 'N/A', height - 200)
        drawField('Amount Paid:', `$${amount}`, height - 220)
        drawField('Ref ID:', transactionRef, height - 240)

        page.drawText('Status: PAID & VERIFIED', { x: 50, y: height - 280, size: 16, font: fontBold, color: rgb(0, 0.6, 0) })

        if (reg.ticket_qr_uuid) {
            const qrDataUrl = await QRCode.toDataURL(reg.ticket_qr_uuid, { margin: 1, width: 150 })
            const pngImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64')
            const pngImage = await pdfDoc.embedPng(pngImageBytes)
            page.drawImage(pngImage, {
                x: width - 200,
                y: height - 250,
                width: 150,
                height: 150
            })
            page.drawText('Scan for Attendance', { x: width - 190, y: height - 270, size: 10, font })
        }

        const pdfBytes = await pdfDoc.save()
        const pdfBuffer = Buffer.from(pdfBytes)

        const fileName = `public/${payment.id}.pdf`

        // We do not strictly fail if storage is missing, but try uploading.
        const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (!uploadError) {
            await supabase.from('payments').update({ receipt_url: fileName }).eq('id', payment.id)
        }
    } catch (e) {
        console.error("PDF Gen Error:", e)
    }

    // 4. Update Registration Status
    if (reg.status === 'pending_approval') {
        await supabase
            .from('registrations')
            .update({ status: 'approved' })
            .eq('id', registrationId)
    }

    await logAction('VERIFY_PAYMENT', 'payments', payment.id, { status: 'verified', method: 'in-person' })

    revalidatePath('/admin/payments')
    revalidatePath(`/status/${reg.reference_number}`)
    return { success: true }
}
