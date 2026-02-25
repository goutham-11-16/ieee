'use server'

import { createClient } from '@/lib/supabase/server'

export async function lookupByPhone(eventId: string, phone: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('registrations')
        .select('reference_number, event:events!inner(id, title)')
        .eq('event_id', eventId)
        .eq('guest_phone', phone)
        .single() // Expects single entry

    if (error || !data) {
        return { error: 'Registration not found for this phone number and event.' }
    }

    return { referenceNumber: data.reference_number }
}

export async function getActiveEvents() {
    const supabase = await createClient()
    const nowLocal = new Date().toISOString()
    const { data, error } = await supabase
        .from('events')
        .select('id, title, date, end_date')
        .order('date', { ascending: false })
        .limit(50) // Adjust if many events 

    // Usually you just want to give them recent/all events, 
    // but maybe we specifically want events where the user could have registered.
    return { data: data || [], error: error?.message }
}
