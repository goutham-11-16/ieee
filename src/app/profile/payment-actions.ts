'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/actions/audit'

export async function uploadPaymentProof(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const registrationId = formData.get('registrationId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const transactionRef = formData.get('transactionRef') as string

    // Mock file upload - in real app, upload to storage bucket and get URL
    const proofUrl = formData.get('proofUrl') as string || 'https://placeholder.com/proof.jpg'

    const { data, error } = await supabase
        .from('payments')
        .insert({
            registration_id: registrationId,
            amount,
            transaction_reference: transactionRef,
            proof_url: proofUrl,
            status: 'pending_verification'
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    await logAction('UPLOAD_PAYMENT', 'payments', data.id, { registrationId, amount })

    revalidatePath('/profile')
    return { success: true }
}
