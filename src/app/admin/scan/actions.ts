'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ScanResult = {
    success: boolean;
    message: string;
    attendeeName?: string;
    errorType?: 'INVALID' | 'DUPLICATE' | 'WRONG_EVENT' | 'NOT_APPROVED';
}

export async function verifyTicket(qrDataString: string, targetEventId: string, sessionName: string = 'Default Scan'): Promise<ScanResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: 'Unauthorized', errorType: 'INVALID' }

    let qrData: any;
    try {
        qrData = JSON.parse(qrDataString)
    } catch (e) {
        return { success: false, message: 'Invalid QR Format', errorType: 'INVALID' }
    }

    const { uuid, regId, event: qrEventId } = qrData

    if (!uuid || !regId || !qrEventId) {
        return { success: false, message: 'Incomplete QR Data', errorType: 'INVALID' }
    }

    // 1. Wrong Event Check
    if (qrEventId !== targetEventId) {
        return { success: false, message: 'Ticket is for a different event', errorType: 'WRONG_EVENT' }
    }

    // 2. Lookup Registration
    const { data: registration } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            ticket_qr_uuid,
            user:profiles!user_id(full_name, email),
            event:events(date, end_date)
        `)
        .eq('id', regId)
        .single()

    if (!registration) {
        return { success: false, message: 'Registration not found', errorType: 'INVALID' }
    }

    // 3. Validate Token
    if (registration.ticket_qr_uuid !== uuid) {
        return { success: false, message: 'Invalid Ticket Token', errorType: 'INVALID' }
    }

    // 4. Validate Status
    if (registration.status !== 'approved') {
        return { success: false, message: `Registration is ${registration.status}`, errorType: 'NOT_APPROVED' }
    }

    // 4.5 Validate Event Time Bounds
    const eventData = registration.event as any;
    if (eventData) {
        const now = new Date();
        const eventStart = new Date(eventData.date);

        // Default to a 12 hour window if end_date doesn't exist just in case
        const eventEnd = eventData.end_date ? new Date(eventData.end_date) : new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);

        if (now < eventStart) {
            return { success: false, message: `Too early. Event starts at ${eventStart.toLocaleTimeString()}`, errorType: 'INVALID' }
        }

        if (now > eventEnd) {
            return { success: false, message: `Event has already ended.`, errorType: 'INVALID' }
        }
    }

    interface RegistrationDetail {
        id: string;
        status: string;
        ticket_qr_uuid: string;
        user: { full_name: string; email: string };
    }
    const reg = registration as unknown as RegistrationDetail;

    // 5. Check Duplicate Scan
    const { data: existingScan } = await supabase
        .from('attendance')
        .select('scanned_at')
        .eq('registration_id', registration.id)
        .eq('session_name', sessionName)
        .single()

    if (existingScan) {
        return {
            success: false,
            message: `Already scanned at ${new Date(existingScan.scanned_at).toLocaleTimeString()}`,
            attendeeName: reg.user.full_name,
            errorType: 'DUPLICATE'
        }
    }

    // 6. Record Attendance
    const { error } = await supabase
        .from('attendance')
        .insert({
            registration_id: registration.id,
            event_id: targetEventId,
            scanned_by: user.id,
            scanned_at: new Date().toISOString(),
            session_name: sessionName
        })

    if (error) {
        return { success: false, message: 'Database Error', errorType: 'INVALID' }
    }

    return {
        success: true,
        message: 'Verified!',
        attendeeName: reg.user.full_name
    }
}
