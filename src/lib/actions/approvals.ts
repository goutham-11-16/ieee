'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ApprovalActionType, ApprovalStatus } from '@/types'

export async function createApprovalRequest(
    actionType: ApprovalActionType,
    entityTable: string,
    entityId: string,
    newData: any
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('approval_requests')
        .insert({
            requester_id: user.id,
            action_type: actionType,
            entity_table: entityTable,
            entity_id: entityId,
            new_data: newData,
            status: 'pending'
        })

    if (error) {
        return { error: error.message }
    }

    // TODO: Send email notification to Super Admins

    return { success: true }
}

export async function approveRequest(requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify Super Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        return { error: 'Insufficient permissions' }
    }

    // Get the request details
    const { data: request } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (!request) return { error: 'Request not found' }

    if (request.status !== 'pending') {
        return { error: 'Request already processed' }
    }

    // EXECUTE THE ACTION based on type
    let actionError = null

    if (request.action_type === 'PUBLISH_EVENT') {
        if (request.entity_id === '00000000-0000-0000-0000-000000000000') {
            const { error } = await supabase
                .from('events')
                .insert({
                    ...request.new_data,
                    is_published: true,
                    status: 'published',
                    updated_at: new Date().toISOString()
                })
            actionError = error
        } else {
            const { error } = await supabase
                .from('events')
                .update({
                    is_published: true,
                    status: 'published',
                    updated_at: new Date().toISOString()
                })
                .eq('id', request.entity_id)
            actionError = error
        }
    } else if (request.action_type === 'DELETE_DATA') {
        // Soft delete
        const { error } = await supabase
            .from(request.entity_table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', request.entity_id)
        actionError = error

    } else if (request.action_type === 'LOCK_TEMPLATE') {
        const { error } = await supabase
            .from('certificate_templates')
            .update({ is_locked: true, updated_at: new Date().toISOString() })
            .eq('id', request.entity_id)
        actionError = error

    } else if (request.action_type === 'EXTEND_DEADLINE') {
        // new_data should contain { registration_end, payment_deadline }
        const { registration_end, payment_deadline } = request.new_data

        const { error } = await supabase
            .from('events')
            .update({
                registration_end,
                payment_deadline,
                updated_at: new Date().toISOString()
            })
            .eq('id', request.entity_id)
        actionError = error
    } else if (request.action_type === 'UPDATE_DATA') {
        const { error } = await supabase
            .from(request.entity_table)
            .update({
                ...request.new_data,
                updated_at: new Date().toISOString()
            })
            .eq('id', request.entity_id)
        actionError = error
    }

    if (actionError) {
        console.error("APPROVAL ACTION ERROR:", actionError);
        return { error: `Action failed: ${actionError.message}` };
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('approval_requests')
        .update({
            status: 'approved',
            approver_id: user.id,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/admin/approvals')
    return { success: true }
}

export async function rejectRequest(requestId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify Admin (Same check as approve)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        return { error: 'Insufficient permissions' }
    }

    const { error } = await supabase
        .from('approval_requests')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            approver_id: user.id,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) return { error: error.message }

    revalidatePath('/admin/approvals')
    return { success: true }
}
