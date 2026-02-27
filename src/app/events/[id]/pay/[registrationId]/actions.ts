'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadTimedPaymentProof(formData: FormData) {
    const supabase = await createClient()

    const registrationId = formData.get('registrationId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const transactionRef = formData.get('transactionRef') as string
    const proofUrl = formData.get('proofUrl') as string

    if (!registrationId || !transactionRef || !proofUrl) {
        return { error: 'Missing required fields' }
    }

    // Verify registration hasn't expired
    const { data: reg, error: fetchError } = await supabase
        .from('registrations')
        .select('expires_at, status')
        .eq('id', registrationId)
        .single()

    if (fetchError || !reg) return { error: 'Registration not found' }

    if (reg.status !== 'pending_payment') {
        return { error: 'Registration is not pending payment.' }
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
            status: 'pending',
            receipt_url: proofUrl
        })
        .select()
        .single()

    if (paymentError) return { error: paymentError.message }

    // Update registration status
    const { error: regError } = await supabase
        .from('registrations')
        .update({ status: 'pending_approval' }) // Wait for finance admin to approve the payment
        .eq('id', registrationId)

    if (regError) return { error: regError.message }

    revalidatePath(`/admin/registrations`)
    revalidatePath(`/admin/payments`)

    return { success: true }
}

export async function expireRegistration(registrationId: string) {
    const supabase = await createClient()

    // Safety check, only expire if pending payment
    const { data } = await supabase.from('registrations').select('status').eq('id', registrationId).single()
    if (data?.status === 'pending_payment') {
        await supabase
            .from('registrations')
            .update({ status: 'expired' })
            .eq('id', registrationId)
    }
    return { success: true }
}
