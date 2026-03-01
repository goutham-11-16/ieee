'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/actions/audit'

function generateReference() {
    const randomHex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()
    return 'KARE-' + randomHex
}

// Function to safely generate a UUID using crypto.randomUUID()
function getUUID() {
    try {
        return crypto.randomUUID()
    } catch (e) {
        // Fallback for older node versions if needed, though Next.js 15+ should have it
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export async function registerForEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to register.' }
    }

    // 1. Proactively delete any stale registrations to allow re-entry
    const admin = createAdminClient()
    const nowISO = new Date().toISOString()

    await admin.from('registrations').delete().eq('user_id', user.id).eq('event_id', eventId).in('status', ['expired', 'rejected', 'cancelled'])
    await admin.from('registrations').delete().eq('user_id', user.id).eq('event_id', eventId).eq('status', 'pending_payment').lt('expires_at', nowISO)

    // 2. Check if already registered (Active)
    const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle()

    if (existing) {
        return { error: 'You are already registered for this event with an active session.' }
    }

    // Fetch event to check approval and deadlines
    const { data: event } = await supabase
        .from('events')
        .select('requires_approval, registration_start, registration_end, date')
        .eq('id', eventId)
        .single()

    if (!event) return { error: 'Event not found' }

    const now = new Date()
    const openDate = event.registration_start ? new Date(event.registration_start) : null
    const closeDate = event.registration_end ? new Date(event.registration_end) : new Date(event.date)

    if (openDate && now < openDate) {
        return { error: 'Registration for this event has not opened yet.' }
    }

    if (now > closeDate) {
        return { error: 'Registration for this event is closed.' }
    }

    const status = event.requires_approval ? 'pending_approval' : 'approved'

    const { data, error } = await supabase
        .from('registrations')
        .insert({
            user_id: user.id,
            event_id: eventId,
            status,
            ticket_qr_uuid: getUUID()
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    if (data) {
        await logAction('REGISTER_EVENT', 'registrations', data.id, {
            eventId,
            prev_state: 'none',
            new_state: status
        })
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true, status }
}

export async function registerGuest(formData: FormData) {
    const supabase = await createClient()

    const eventId = formData.get('eventId') as string
    const guestRegNo = formData.get('guestRegNo') as string
    const guestName = formData.get('guestName') as string
    const guestEmail = formData.get('guestEmail') as string
    const guestPhone = formData.get('guestPhone') as string
    const guestInstitution = formData.get('guestInstitution') as string

    let customResponses = {}
    let teamMembers = []
    try {
        customResponses = JSON.parse((formData.get('customResponses') as string) || '{}')
        teamMembers = JSON.parse((formData.get('teamMembers') as string) || '[]')
    } catch (e) { console.error('Failed to parse dynamic form data') }

    // Fetch event
    const { data: event } = await supabase
        .from('events')
        .select('requires_approval, registration_start, registration_end, date, max_capacity, fees, is_capacity_by_teams')
        .eq('id', eventId)
        .single()

    if (!event) return { error: 'Event not found' }

    // Capacity Check
    if (event.max_capacity) {
        const { data: activeRegs } = await supabase
            .from('registrations')
            .select('team_members, status, expires_at')
            .eq('event_id', eventId)
            .in('status', ['approved', 'pending_approval', 'pending_payment'])

        if (activeRegs) {
            const nowTime = new Date().getTime()
            const takenSeats = activeRegs.reduce((acc, reg) => {
                if (reg.status === 'pending_payment' && reg.expires_at) {
                    const expTime = new Date(reg.expires_at).getTime()
                    if (nowTime > expTime) return acc // Expired seat
                }

                if (event.is_capacity_by_teams) {
                    return acc + 1 // Count as 1 team/slot
                } else {
                    const teamCount = Array.isArray(reg.team_members) ? reg.team_members.length : 0
                    return acc + 1 + teamCount // Count every human
                }
            }, 0)

            const requestedSeats = event.is_capacity_by_teams ? 1 : (1 + teamMembers.length)
            if (takenSeats + requestedSeats > event.max_capacity) {
                return { error: `Not enough slots available. Only ${event.max_capacity - takenSeats} slots left.` }
            }
        }
    }

    // Proactive cleanup using Admin client
    const admin = createAdminClient()
    const nowTimeStr = new Date().toISOString()

    // Check for duplicates with cleanup
    if (guestPhone) {
        await admin.from('registrations').delete().eq('event_id', eventId).eq('guest_phone', guestPhone).in('status', ['expired', 'rejected', 'cancelled'])
        await admin.from('registrations').delete().eq('event_id', eventId).eq('guest_phone', guestPhone).eq('status', 'pending_payment').lt('expires_at', nowTimeStr)

        const { data: phoneReg } = await supabase.from('registrations').select('id').eq('event_id', eventId).eq('guest_phone', guestPhone).limit(1)
        if (phoneReg && phoneReg.length > 0) {
            return { error: 'This Phone Number is already registered for this event.' }
        }
    }

    if (guestRegNo) {
        await admin.from('registrations').delete().eq('event_id', eventId).eq('guest_reg_no', guestRegNo).in('status', ['expired', 'rejected', 'cancelled'])
        await admin.from('registrations').delete().eq('event_id', eventId).eq('guest_reg_no', guestRegNo).eq('status', 'pending_payment').lt('expires_at', nowTimeStr)

        const { data: regNoReg } = await supabase.from('registrations').select('id').eq('event_id', eventId).eq('guest_reg_no', guestRegNo).limit(1)
        if (regNoReg && regNoReg.length > 0) {
            return { error: 'This Registration Number is already registered for this event.' }
        }
    }

    if (guestEmail) {
        await admin.from('registrations').delete().eq('event_id', eventId).eq('guest_email', guestEmail).in('status', ['expired', 'rejected', 'cancelled'])
        await admin.from('registrations').delete().eq('event_id', eventId).eq('guest_email', guestEmail).eq('status', 'pending_payment').lt('expires_at', nowTimeStr)

        const { data: emailReg } = await supabase.from('registrations').select('id').eq('event_id', eventId).eq('guest_email', guestEmail).limit(1)
        if (emailReg && emailReg.length > 0) {
            return { error: 'This Email Address is already registered for this event.' }
        }
    }

    const now = new Date()
    const openDate = event.registration_start ? new Date(event.registration_start) : null
    const closeDate = event.registration_end ? new Date(event.registration_end) : new Date(event.date)

    if (openDate && now < openDate) {
        return { error: 'Registration for this event has not opened yet.' }
    }

    if (now > closeDate) {
        return { error: 'Registration for this event is closed.' }
    }

    let status = event.requires_approval ? 'pending_approval' : 'approved'
    let expiresAt = null
    let referenceNumber = ''

    if (event.fees > 0) {
        status = 'pending_payment'
        expiresAt = new Date(Date.now() + 5 * 60000).toISOString() // 5 minutes
        referenceNumber = `TEMP-${getUUID().slice(0, 8).toUpperCase()}`
    } else {
        referenceNumber = generateReference()
    }

    const { data, error } = await supabase
        .from('registrations')
        .insert({
            event_id: eventId,
            guest_reg_no: guestRegNo,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            guest_institution: guestInstitution,
            reference_number: referenceNumber,
            ticket_qr_uuid: getUUID(),
            status,
            expires_at: expiresAt,
            custom_responses: customResponses,
            team_members: teamMembers
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Log using Admin client (ensures it works even if guest)
    if (data) {
        await admin.from('audit_logs').insert({
            action: 'REGISTER_GUEST',
            entity_type: 'registrations',
            entity_id: data.id,
            new_values: {
                eventId,
                referenceNumber,
                prev_state: 'none',
                new_state: status,
                timestamp: new Date().toISOString()
            }
        })
    }

    revalidatePath(`/events/${eventId}`)

    return {
        success: true,
        status,
        referenceNumber,
        registrationId: data?.id,
        isPaidEvent: event.fees > 0
    }
}
