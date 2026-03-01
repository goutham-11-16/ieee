'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadTimedPaymentProof(formData: FormData) {
    try {
        const supabase = createAdminClient()

        const randomHex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()
        const finalReferenceNumber = 'KARE-' + randomHex

        const registrationId = formData.get('registrationId') as string
        const amountStr = formData.get('amount') as string
        const amount = parseFloat(amountStr)
        const transactionRef = formData.get('transactionRef') as string
        const proofUrl = formData.get('proofUrl') as string

        console.log(`Processing timed payment: reg=${registrationId}, amount=${amount}, ref=${transactionRef}`);

        if (!registrationId || !transactionRef || !proofUrl || isNaN(amount)) {
            return { error: 'Missing or invalid required fields. Amount: ' + amountStr }
        }

        // Verify registration hasn't expired
        const { data: reg, error: fetchError } = await supabase
            .from('registrations')
            .select('expires_at, status')
            .eq('id', registrationId)
            .maybeSingle()

        if (fetchError || !reg) {
            console.error("Fetch error or registration missing:", fetchError);
            return { error: 'Registration not found or inaccessible.' }
        }

        if (reg.status !== 'pending_payment') {
            return { error: 'Registration is not pending payment (Current status: ' + reg.status + ').' }
        }

        const now = new Date()
        const expiresAt = new Date(reg.expires_at)

        // We give a slightly generous 30-second buffer on the backend just in case of slow uploads
        if (now.getTime() > expiresAt.getTime() + 30000) {
            return { error: 'Payment session has expired. Please restart registration.' }
        }

        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                registration_id: registrationId,
                amount,
                transaction_reference: transactionRef,
                status: 'pending_verification',
                proof_url: proofUrl
            })
            .select()
            .single()

        if (paymentError) {
            console.error("Payment insert error:", paymentError);
            return { error: paymentError.message }
        }

        // Update registration status and assign final reference number
        const { error: regError } = await supabase
            .from('registrations')
            .update({ status: 'pending_approval', reference_number: finalReferenceNumber }) // Wait for finance admin to approve the payment
            .eq('id', registrationId)

        if (regError) {
            console.error("Registration update error:", regError);
            return { error: regError.message }
        }

        revalidatePath(`/admin/registrations`)
        revalidatePath(`/admin/payments`)

        return { success: true, referenceNumber: finalReferenceNumber }
    } catch (e: any) {
        console.error("CRITICAL ERROR in uploadTimedPaymentProof:", e);
        return { error: 'An internal server error occurred: ' + (e.message || 'Unknown error') }
    }
}

export async function expireRegistration(registrationId: string) {
    try {
        const supabase = createAdminClient()

        // Safety check, only expire if pending payment
        const { data } = await supabase.from('registrations').select('status').eq('id', registrationId).maybeSingle()
        if (data?.status === 'pending_payment') {
            const { error: deleteError } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registrationId)

            if (deleteError) console.error("Auto-expiry delete error:", deleteError)
        }
        return { success: true }
    } catch (e) {
        console.error("Auto-expiry exception:", e)
        return { success: false }
    }
}
