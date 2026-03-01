'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadPaymentProof(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const registrationId = formData.get('registrationId') as string
    const reference = formData.get('reference') as string // passed so we can revalidate if needed
    const amountStr = formData.get('amount') as string
    const transactionRef = formData.get('transactionRef') as string
    const proofFile = formData.get('proof') as File

    if (!proofFile || proofFile.size === 0) {
        return { error: 'Payment proof file is required' }
    }

    // Upload to the 'receipts' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(`public/${registrationId}-${Date.now()}-${proofFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`, proofFile)

    if (uploadError) return { error: `Failed to upload file: ${uploadError.message}` }

    const { error: dbError } = await supabase
        .from('payments')
        .insert({
            registration_id: registrationId,
            amount: parseFloat(amountStr),
            transaction_reference: transactionRef,
            proof_url: uploadData.path,
            status: 'pending_verification'
        })

    if (dbError) return { error: 'Failed to save payment record' }

    // Update registration status to pending_approval
    await adminSupabase
        .from('registrations')
        .update({ status: 'pending_approval' })
        .eq('id', registrationId)

    // Log the public action
    await supabase.from('audit_logs').insert({
        action: 'UPLOAD_PAYMENT_PROOF',
        entity_type: 'payments',
        entity_id: registrationId,
        new_values: { transactionRef, amount: amountStr }
    })

    return { success: true }
}

export async function saveGoogleDrivePayment(registrationId: string, amount: string, transactionRef: string, fileUrl: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { error: dbError } = await supabase
        .from('payments')
        .insert({
            registration_id: registrationId,
            amount: parseFloat(amount),
            transaction_reference: transactionRef,
            proof_url: fileUrl,
            status: 'pending_verification'
        })

    if (dbError) return { error: 'Failed to save payment record' }

    // Update registration status to pending_approval
    await adminSupabase
        .from('registrations')
        .update({ status: 'pending_approval' })
        .eq('id', registrationId)

    // Log the public action
    await supabase.from('audit_logs').insert({
        action: 'UPLOAD_PAYMENT_PROOF_GDRIVE',
        entity_type: 'payments',
        entity_id: registrationId,
        new_values: { transactionRef, amount, fileUrl }
    })

    return { success: true }
}
