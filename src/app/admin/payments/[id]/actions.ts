'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { logAction } from '@/lib/actions/audit'
import QRCode from 'qrcode'
import { generateUUID } from '@/lib/utils'

import { createAdminClient } from '@/lib/supabase/admin'

export async function verifyPayment(paymentId: string, registrationId: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['finance_admin', 'super_admin', 'admin'].includes(profile.role)) {
        return { error: 'Unauthorized. Only Finance Admins or Super Admins can verify payments.' }
    }

    // 1. Fetch details for Receipt
    const { data: payment } = await adminSupabase
        .from('payments')
        .select(`
            amount, 
            transaction_reference, 
            created_at,
            registration_id,
            registration:registrations!registration_id(
                id,
                reference_number,
                ticket_qr_uuid,
                guest_name,
                user:profiles!registrations_user_id_fkey(full_name),
                event:events(title)
            )
        `)
        .eq('id', paymentId)
        .single()

    if (!payment) return { error: 'Payment not found' }

    // 2. Generate PDF Receipt
    try {
        const p = payment as any;
        const reg = Array.isArray(p.registration) ? p.registration[0] : p.registration;
        const targetRegId = p.registration_id || reg?.id;

        if (!reg || !targetRegId) return { error: 'Associated registration not found' }

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([600, 400])
        const { width, height } = page.getSize()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        page.drawText('PAYMENT RECEIPT', { x: 50, y: height - 80, size: 24, font: fontBold, color: rgb(0, 0, 0) })

        const drawField = (label: string, value: string, y: number) => {
            page.drawText(label, { x: 50, y, size: 12, font: fontBold })
            page.drawText(value, { x: 150, y, size: 12, font })
        }

        drawField('Receipt ID:', paymentId.slice(0, 8).toUpperCase(), height - 120)
        drawField('Date:', new Date().toLocaleDateString(), height - 140)

        const eventTitle = Array.isArray(reg?.event) ? reg.event[0]?.title : reg?.event?.title;
        const payerName = reg?.guest_name || (Array.isArray(reg?.user) ? reg.user[0]?.full_name : reg?.user?.full_name);

        drawField('Event:', eventTitle || 'Unknown Event', height - 180)
        drawField('Payer:', payerName || 'N/A', height - 200)
        drawField('Amount:', `Rs. ${p.amount}`, height - 220)
        drawField('Ref ID:', p.transaction_reference || 'N/A', height - 240)

        page.drawText('Status: VERIFIED', { x: 50, y: height - 280, size: 16, font: fontBold, color: rgb(0, 0.6, 0) })

        // Generate QR Code
        const ticketQrUuid = reg?.ticket_qr_uuid || generateUUID()
        if (ticketQrUuid) {
            const qrDataUrl = await QRCode.toDataURL(ticketQrUuid, { margin: 1, width: 150 })
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

        // Serialize
        const pdfBytes = await pdfDoc.save()
        const pdfBuffer = Buffer.from(pdfBytes)

        // Upload Receipt
        const fileName = `receipts/${paymentId}.pdf`
        await adminSupabase.storage
            .from('receipts')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        // 3. Update Payment Status (Online Payments)
        const { error: updateError } = await adminSupabase
            .from('payments')
            .update({
                status: 'verified',
                verified_by: user.id,
                verified_at: new Date().toISOString(),
                receipt_url: fileName
            })
            .eq('id', paymentId)

        if (updateError) return { error: updateError.message }

        // 4. Update Registration Status & Fix Reference ID if it's still TEMP-
        let newRef = reg.reference_number;
        if (reg.reference_number?.startsWith('TEMP-')) {
            const randomHex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()
            newRef = 'KARE-' + randomHex
        }

        console.log(`Updating registration ${targetRegId}: status=approved, ref=${newRef}`);

        const { error: regUpdateError } = await adminSupabase
            .from('registrations')
            .update({
                status: 'approved',
                ticket_qr_uuid: ticketQrUuid,
                reference_number: newRef
            })
            .eq('id', targetRegId)

        if (regUpdateError) {
            console.error('Registration update failed:', regUpdateError);
            return { error: 'Registration update failed: ' + regUpdateError.message }
        }

        await logAction('VERIFY_PAYMENT', 'payments', paymentId, {
            status: 'verified',
            generatedReceipt: fileName,
            prev_status: reg.status,
            new_status: 'approved'
        })

        revalidatePath('/admin/payments')
        revalidatePath(`/status/${reg.reference_number}`)
        revalidatePath(`/status/${newRef}`)

        return { success: true, newReferenceNumber: newRef }

    } catch (e: any) {
        console.error(e)
        return { error: 'Failed to verify payment: ' + (e.message || 'Unknown error') }
    }
}

export async function rejectPayment(paymentId: string, reason: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['finance_admin', 'super_admin', 'admin'].includes(profile.role)) {
        return { error: 'Unauthorized. Only Finance Admins or Super Admins can reject payments.' }
    }

    // Fetch the payment to get the registration ID
    const { data: payment } = await supabase
        .from('payments')
        .select('registration_id')
        .eq('id', paymentId)
        .single()

    if (!payment) return { error: 'Payment not found' }

    const { error } = await adminSupabase
        .from('payments')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            verified_by: user.id,
            verified_at: new Date().toISOString()
        })
        .eq('id', paymentId)

    if (error) return { error: error.message }

    // Grant a 24-hour extension for the user to re-upload payment proof
    const { error: regError } = await adminSupabase
        .from('registrations')
        .update({
            status: 'pending_payment',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', payment.registration_id)

    if (regError) return { error: regError.message }

    await logAction('REJECT_PAYMENT', 'payments', paymentId, {
        reason,
        prev_state: 'pending_verification',
        new_state: 'rejected'
    })

    revalidatePath('/admin/payments')
    return { success: true }
}
