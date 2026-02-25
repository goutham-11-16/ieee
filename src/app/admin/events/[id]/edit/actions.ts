'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createApprovalRequest } from '@/lib/actions/approvals'
import { logAction } from '@/lib/actions/audit'

export async function updateEvent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const allowedRoles = ['admin', 'super_admin', 'event_admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
        return { error: 'Insufficient permissions to edit events.' }
    }

    const eventId = formData.get('eventId') as string

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const eventType = formData.get('eventType') as string || 'General'
    const date = formData.get('date') as string
    const endDate = formData.get('endDate') as string
    const location = formData.get('location') as string
    const maxCapacity = formData.get('maxCapacity') ? parseInt(formData.get('maxCapacity') as string) : null
    const requiresApproval = formData.get('requiresApproval') === 'on'

    const registrationStart = formData.get('registrationStart') ? formData.get('registrationStart') as string : null
    const registrationEnd = formData.get('registrationEnd') ? formData.get('registrationEnd') as string : null
    const paymentDeadline = formData.get('paymentDeadline') ? formData.get('paymentDeadline') as string : null
    const fees = formData.get('fees') ? parseFloat(formData.get('fees') as string) : 0.00

    const isFeePerPerson = formData.get('isFeePerPerson') === 'on'
    const isTeamEvent = formData.get('isTeamEvent') === 'on'
    const minTeamSize = formData.get('minTeamSize') ? parseInt(formData.get('minTeamSize') as string) : 1
    const maxTeamSize = formData.get('maxTeamSize') ? parseInt(formData.get('maxTeamSize') as string) : 1

    const paymentQr = formData.get('paymentQr') as File | null
    let paymentQrUrl = formData.get('existingPaymentQr') as string | null

    if (paymentQr && paymentQr.size > 0) {
        const fileExt = paymentQr.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('event_assets')
            .upload(`payment-qrs/${fileName}`, paymentQr)

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('event_assets')
                .getPublicUrl(`payment-qrs/${fileName}`)
            paymentQrUrl = publicUrl
        }
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

    const eventData = {
        title,
        description,
        event_type: eventType,
        date: date || null,
        end_date: endDate || null,
        location,
        max_capacity: maxCapacity,
        requires_approval: requiresApproval,
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
        payment_qr_url: paymentQrUrl,
        updated_at: new Date().toISOString()
    }

    if (profile?.role === 'super_admin' || profile?.role === 'admin') {
        const { error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', eventId)

        if (error) return { error: error.message }
        await logAction('UPDATE_EVENT', 'events', eventId, eventData)
        revalidatePath(`/admin/events/${eventId}`)
        redirect(`/admin/events/${eventId}`)
    } else {
        // Event Admin must request approval to update full metadata
        const result = await createApprovalRequest(
            'UPDATE_DATA',
            'events',
            eventId,
            eventData
        )

        if (result.error) return result
        await logAction('REQUEST_UPDATE_EVENT', 'events', eventId, { title })
        revalidatePath(`/admin/events/${eventId}`)
        redirect(`/admin/events/${eventId}`)
    }
}
