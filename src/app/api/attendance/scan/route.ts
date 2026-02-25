import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { // add check for admin/volunteer role
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { qrValue } = body

    if (!qrValue) {
        return NextResponse.json({ error: 'Missing QR Value' }, { status: 400 })
    }

    // Find registration by ID (which is the QR value in our simple implementation)
    const { data: registration } = await supabase
        .from('registrations')
        .select('id, event_id, status, user:profiles!user_id(full_name)')
        .eq('id', qrValue) // or ticket_qr_uuid if using that
        .single()

    if (!registration) {
        return NextResponse.json({ error: 'Invalid Ticket' }, { status: 404 })
    }

    if (registration.status !== 'approved') {
        return NextResponse.json({ error: `Registration status is ${registration.status}` }, { status: 400 })
    }

    // Check if already scanned
    const { data: existingScan } = await supabase
        .from('attendance') // Assuming this table exists, I defined it in schema
        .select('id')
        .eq('registration_id', registration.id)
        .single()

    if (existingScan) {
        return NextResponse.json({ error: 'Already Checked In' }, { status: 409 })
    }

    // Record attendance
    const { error } = await supabase
        .from('attendance')
        .insert({
            registration_id: registration.id,
            event_id: registration.event_id,
            scanned_by: user.id,
            check_in_time: new Date().toISOString()
        })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        participant: (registration.user as any)?.full_name
    })
}
