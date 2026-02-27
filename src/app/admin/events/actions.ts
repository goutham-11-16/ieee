'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAction } from '@/lib/actions/audit'
import { createApprovalRequest } from '@/lib/actions/approvals'

export async function createEvent(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const allowedRoles = ['admin', 'super_admin', 'event_admin']
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
        return { error: 'Insufficient permissions to create events.' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const eventType = formData.get('eventType') as string || 'General'
    const date = formData.get('date') as string
    const endDate = formData.get('endDate') as string
    const location = formData.get('location') as string
    const maxCapacity = formData.get('maxCapacity') ? parseInt(formData.get('maxCapacity') as string) : null
    const requiresApproval = formData.get('requiresApproval') === 'on'

    // Action determines initial status
    const action = formData.get('action') as string // 'draft' | 'submit'

    // New Fields
    const registrationStart = formData.get('registrationStart') as string || null
    const registrationEnd = formData.get('registrationEnd') as string || null
    const paymentDeadline = formData.get('paymentDeadline') as string || null
    const fees = formData.get('fees') ? parseFloat(formData.get('fees') as string) : 0.00

    // Dynamic Form and Team Logic
    const isFeePerPerson = formData.get('isFeePerPerson') === 'on'
    const isTeamEvent = formData.get('isTeamEvent') === 'on'
    const minTeamSize = formData.get('minTeamSize') ? parseInt(formData.get('minTeamSize') as string) : 1
    const maxTeamSize = formData.get('maxTeamSize') ? parseInt(formData.get('maxTeamSize') as string) : 1

    const paymentQr = formData.get('paymentQr') as File | null
    let paymentQrUrl = null

    if (!paymentQr || paymentQr.size === 0) {
        return { error: 'Payment QR Code is required to create an event.' }
    }

    try {
        const arrayBuffer = await paymentQr.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');

        const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
        if (!scriptUrl) {
            console.error("Missing NEXT_PUBLIC_GOOGLE_SCRIPT_URL environment variable.");
            return { error: 'Server configuration error: Google Script URL is missing.' };
        }

        const uploadPayload = {
            base64Data: base64Data,
            filename: paymentQr.name,
            mimeType: paymentQr.type,
            eventTitle: title, // Tell script which event this is for 
            targetFolder: 'QR Code' // Put it in the "QR Code" subfolder
        };

        const uploadResponse = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(uploadPayload)
        });

        const rawText = await uploadResponse.text();
        const uploadResult = JSON.parse(rawText);

        if (!uploadResult.success) {
            console.error("Google Script Upload Error:", uploadResult.error);
            return { error: 'Failed to upload QR code to Google Drive.' };
        }

        paymentQrUrl = uploadResult.url;
    } catch (error) {
        console.error("Failed to upload QR Code:", error);
        return { error: 'Server error while uploading QR code.' };
    }

    let disabledDefaultFields = []
    let formSchema = []
    let teamMemberSettings = {}
    let attendanceSessions = []
    try {
        disabledDefaultFields = JSON.parse((formData.get('disabledDefaultFields') as string) || '[]')
        formSchema = JSON.parse((formData.get('formSchema') as string) || '[]')
        teamMemberSettings = JSON.parse((formData.get('teamMemberSettings') as string) || '{}')
        attendanceSessions = JSON.parse((formData.get('attendanceSessions') as string) || '[]')
    } catch (e) { console.error('Error parsing JSON schemas from form', e) }

    const coordinatorsRaw = formData.get('coordinators') as string
    const coordinators = coordinatorsRaw ? JSON.parse(coordinatorsRaw) : []

    // Determine Status
    let status = 'draft'
    let isPublished = false

    // If submitting, we set to 'pending_approval' (unless super admin, who might auto-publish, 
    // but for this scenario we strictly follow the flow: submit -> approval)
    if (action === 'submit') {
        if (profile?.role === 'super_admin' || profile?.role === 'admin') {
            status = 'published'
            isPublished = true
        } else {
            status = 'pending_approval'
            isPublished = false
        }
    }

    const eventData = {
        title,
        description,
        event_type: eventType,
        date,
        end_date: endDate,
        location,
        max_capacity: maxCapacity,
        requires_approval: requiresApproval,
        is_published: isPublished,
        status: status,
        created_by: user.id,
        registration_start: registrationStart,
        registration_end: registrationEnd,
        payment_deadline: paymentDeadline,
        fees,
        is_fee_per_person: isFeePerPerson,
        coordinators,
        is_team_event: isTeamEvent,
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        disabled_default_fields: disabledDefaultFields,
        form_schema: formSchema,
        team_member_settings: teamMemberSettings,
        attendance_sessions: attendanceSessions,
        payment_qr_url: paymentQrUrl
    }

    if (status === 'pending_approval' || (status === 'draft' && profile?.role === 'event_admin')) {
        // Using PUBLISH_EVENT as a flexible queue for new event creation without hitting DB ENUM constraints
        await createApprovalRequest(
            'PUBLISH_EVENT',
            'events',
            '00000000-0000-0000-0000-000000000000', // Placeholder ID for new objects
            eventData
        )
        await logAction('CREATE_EVENT_REQUEST', 'events', '00000000-0000-0000-0000-000000000000', { title, status: 'pending_approval' })
        revalidatePath('/admin/events')
        redirect('/admin/events')
    }

    const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

    if (error) {
        console.error("EVENT INSERT ERROR:", error)
        throw new Error('Supabase Create Event Error: ' + error.message)
    }

    await logAction('CREATE_EVENT', 'events', data.id, { title, status })

    revalidatePath('/admin/events')
    redirect('/admin/events')
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

    // If not super admin, create approval request for deletion
    if (!isSuperAdmin) {
        // Check if already deleted or exists
        const { data: event } = await supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single()

        if (!event) return { error: 'Event not found' }

        const { createApprovalRequest } = await import('@/lib/actions/approvals')
        await createApprovalRequest(
            'DELETE_DATA',
            'events',
            eventId,
            { deleted_at: new Date().toISOString() } // The intended change
        )

        return { message: 'Deletion request submitted for approval.' }
    }

    // Super Admin can delete permanently
    try {
        // First, find all registrations to cascade delete related child records
        const { data: regs, error: regSelectError } = await supabase
            .from('registrations')
            .select('id')
            .eq('event_id', eventId)

        if (regSelectError) return { error: 'Failed to read registrations: ' + regSelectError.message }

        const regIds = regs?.map(r => r.id) || []

        if (regIds.length > 0) {
            // Delete certificates linked to these registrations
            const { error: certsError } = await supabase.from('certificates').delete().in('registration_id', regIds)
            if (certsError) return { error: 'Failed to delete certificates: ' + certsError.message }

            // Delete payments linked to these registrations
            const { error: paymentsError } = await supabase.from('payments').delete().in('registration_id', regIds)
            if (paymentsError) return { error: 'Failed to delete payments: ' + paymentsError.message }
        }

        // Delete attendance records for the event
        const { error: attError } = await supabase.from('attendance').delete().eq('event_id', eventId)
        if (attError) return { error: 'Failed to delete attendance: ' + attError.message }

        // Delete certificate templates for the event
        const { error: tplError } = await supabase.from('certificate_templates').delete().eq('event_id', eventId)
        if (tplError) return { error: 'Failed to delete certificate templates: ' + tplError.message }

        // Delete any pending approval requests tied to this event
        const { error: arError } = await supabase.from('approval_requests')
            .delete()
            .eq('entity_id', eventId)
            .eq('entity_table', 'events')
        if (arError) return { error: 'Failed to delete approval requests: ' + arError.message }

        // Delete registrations
        const { error: delRegError } = await supabase.from('registrations').delete().eq('event_id', eventId)
        if (delRegError) return { error: 'Failed to delete registrations: ' + delRegError.message }

        // Finally, delete the event itself
        const { error: eventDelError, count } = await supabase
            .from('events')
            .delete({ count: 'exact' }) // Hard delete
            .eq('id', eventId)

        if (eventDelError) {
            console.error('Hard delete error on events table:', eventDelError)
            return { error: 'Failed to permanently delete the event data (Final step): ' + eventDelError.message }
        }

        if (count === 0) {
            return { error: 'Deletion blocked by database security policies (RLS). Ensure Super Admins have DELETE privileges, or contact support.' }
        }

        await logAction('PERMANENT_DELETE_EVENT', 'events', eventId, { action: 'hard_delete' })
        revalidatePath('/admin/events')
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in deleteEvent:', e)
        return { error: 'An unexpected server error occurred: ' + (e.message || String(e)) }
    }
}
