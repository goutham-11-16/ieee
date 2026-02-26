'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { logAction } from '@/lib/actions/audit'

export async function forceMarkPaid(registrationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['super_admin', 'admin', 'finance_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized role for payment override.' }
    }

    const { data: reg } = await supabase.from('registrations').select('event_id, events(fees)').eq('id', registrationId).single()
    if (!reg) return { success: false, error: 'Registration not found' }

    const amount = (reg as any).events?.fees || 0
    const transactionRef = 'FORCE-OVERRIDE-' + crypto.randomBytes(4).toString('hex').toUpperCase()

    // Create verified payment
    const { error: paymentError } = await supabase.from('payments').insert({
        registration_id: registrationId,
        amount,
        transaction_reference: transactionRef,
        status: 'verified',
        verified_by: user.id,
        verified_at: new Date().toISOString()
    })

    if (paymentError) return { success: false, error: paymentError.message }

    // Update reg status if needed
    await supabase.from('registrations').update({ status: 'approved' }).eq('id', registrationId).eq('status', 'pending_approval')

    await logAction('FORCE_VERIFY_PAYMENT', 'payments', registrationId, { method: 'admin_override' })

    revalidatePath(`/admin/registrations/${registrationId}`)
    return { success: true }
}

export async function forceMarkAttended(registrationId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['super_admin', 'admin', 'event_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized role for attendance override.' }
    }

    // Check if already checked in
    const { data: existing } = await supabase.from('attendance').select('id').eq('registration_id', registrationId).single()
    if (existing) return { success: false, error: 'Already marked as attended.' }

    const { error } = await supabase.from('attendance').insert({
        event_id: eventId,
        registration_id: registrationId,
        scanned_by: user.id,
        check_in_time: new Date().toISOString()
    })

    if (error) return { success: false, error: error.message }

    await logAction('FORCE_MARK_ATTENDANCE', 'attendance', registrationId, { method: 'admin_override' })

    revalidatePath(`/admin/registrations/${registrationId}`)
    return { success: true }
}
