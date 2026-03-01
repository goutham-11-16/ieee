'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { logAction } from '@/lib/actions/audit'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function verifyPayment(paymentId: string, registrationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['finance_admin', 'super_admin', 'admin'].includes(profile.role)) {
        return { error: 'Unauthorized. Only Finance Admins or Super Admins can verify payments.' }
    }

    // 1. Fetch details for Receipt
    const { data: payment } = await supabase
        .from('payments')
        .select(`
            amount, 
            transaction_reference, 
            created_at,
            registration:registrations(
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
    // In a real app, load a template. Here we create from scratch.
    try {
        interface PaymentDetail {
            amount: number;
            transaction_reference: string;
            created_at: string;
            registration: {
                ticket_qr_uuid: string;
                guest_name: string;
                user: any;
                event: any;
            };
        }
        const p = payment as unknown as PaymentDetail;

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([600, 400])
        const { width, height } = page.getSize()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        page.drawText('Use this as a placeholder for the logo', { x: 50, y: height - 50, size: 12, font: font, color: rgb(0.5, 0.5, 0.5) })

        page.drawText('PAYMENT RECEIPT', { x: 50, y: height - 80, size: 24, font: fontBold, color: rgb(0, 0, 0) })

        const drawField = (label: string, value: string, y: number) => {
            page.drawText(label, { x: 50, y, size: 12, font: fontBold })
            page.drawText(value, { x: 150, y, size: 12, font })
        }

        drawField('Receipt ID:', paymentId.slice(0, 8).toUpperCase(), height - 120)
        drawField('Date:', new Date().toLocaleDateString(), height - 140)

        const eventTitle = Array.isArray(p.registration?.event) ? p.registration.event[0]?.title : p.registration?.event?.title;
        const payerName = p.registration?.guest_name || (Array.isArray(p.registration?.user) ? p.registration.user[0]?.full_name : p.registration?.user?.full_name);

        drawField('Event:', eventTitle || 'Unknown Event', height - 180)
        drawField('Payer:', payerName || 'N/A', height - 200)
        drawField('Amount:', `₹${p.amount}`, height - 220)
        drawField('Ref ID:', p.transaction_reference || 'N/A', height - 240)

        page.drawText('Status: VERIFIED', { x: 50, y: height - 280, size: 16, font: fontBold, color: rgb(0, 0.6, 0) })

        // Generate QR Code
        const ticketQrUuid = p.registration?.ticket_qr_uuid || crypto.randomUUID()
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
        const { error: uploadError } = await supabase.storage
            .from('receipts') // Ensure this bucket exists!
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (uploadError) {
            console.error('Receipt upload failed', uploadError)
            // Proceed anyway? Or fail? Let's proceed but warn.
        }

        // 3. Update Status
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: 'verified',
                verified_by: user.id,
                verified_at: new Date().toISOString(),
                receipt_url: fileName
            })
            .eq('id', paymentId)

        if (updateError) return { error: updateError.message }

        // 4. Update Registration if needed
        // Check if registration is waiting for payment? 
        // Logic: specific events might require manual approval regardless of payment.
        // But if `requires_approval` was false (default), it might be 'approved' already.
        // If it WAS 'pending_approval', does payment verify it? Usually yes for paid events.
        // Let's assume verifying payment -> Approves registration if it's strictly just a payment wait.

        await supabase
            .from('registrations')
            .update({ status: 'approved', ticket_qr_uuid: ticketQrUuid })
            .eq('id', registrationId)

        await logAction('VERIFY_PAYMENT', 'payments', paymentId, {
            status: 'verified',
            generatedReceipt: fileName,
            prev_state: 'pending_verification',
            new_state: 'verified'
        })

        revalidatePath('/admin/payments')
        return { success: true }

    } catch (e) {
        console.error(e)
        return { error: 'Failed to generate receipt or verify.' }
    }
}

export async function rejectPayment(paymentId: string, reason: string) {
    const supabase = await createClient()
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

    const { error } = await supabase
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
    const { error: regError } = await supabase
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
