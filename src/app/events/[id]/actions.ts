'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/actions/audit'
import { nanoid } from 'nanoid' // We'll use Math.random for simplicity if nanoid isn't installed. Let's use a standard crypto fallback.
import crypto from 'crypto'

function generateReference() {
    return 'KARE-' + crypto.randomBytes(4).toString('hex').toUpperCase()
}

export async function registerForEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to register.' }
    }

    // Check if already registered
    const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single()

    if (existing) {
        return { error: 'You are already registered for this event.' }
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
            ticket_qr_uuid: crypto.randomUUID()
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    await logAction('REGISTER_EVENT', 'registrations', data.id, {
        eventId,
        prev_state: 'none',
        new_state: status
    })

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

    // Check for duplicates
    if (guestPhone) {
        const { data: phoneReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('event_id', eventId)
            .eq('guest_phone', guestPhone)
            .limit(1)
        if (phoneReg && phoneReg.length > 0) {
            return { error: 'This Phone Number is already registered for this event.' }
        }
    }

    if (guestRegNo) {
        const { data: regNoReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('event_id', eventId)
            .eq('guest_reg_no', guestRegNo)
            .limit(1)
        if (regNoReg && regNoReg.length > 0) {
            return { error: 'This Registration Number is already registered for this event.' }
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

    // If event is paid, force pending_payment and 5-min timer
    if (event.fees > 0) {
        status = 'pending_payment'
        expiresAt = new Date(Date.now() + 5 * 60000).toISOString() // 5 minutes
    }

    const referenceNumber = generateReference()

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
            ticket_qr_uuid: crypto.randomUUID(),
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

    // Attempt to log it (using system/null actor since it's public)
    await supabase.from('audit_logs').insert({
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

    revalidatePath(`/events/${eventId}`)

    return {
        success: true,
        status,
        referenceNumber,
        registrationId: data.id,
        isPaidEvent: event.fees > 0
    }
}
