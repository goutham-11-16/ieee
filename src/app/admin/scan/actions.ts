'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/actions/audit'

export type ScanResult = {
    success: boolean;
    message: string;
    attendeeName?: string;
    teamMembers?: any[];
    errorType?: 'INVALID' | 'DUPLICATE' | 'WRONG_EVENT' | 'NOT_APPROVED';
    missedSessions?: string[];
    registrationId?: string;
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
            team_members,
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

    // 5. Fetch all scans for this registration
    const { data: existingScans } = await supabase
        .from('attendance')
        .select('scanned_at, session_name')
        .eq('registration_id', registration.id)

    const scannedSessionNames = existingScans?.map(s => s.session_name) || []

    // 6. Check Duplicate Scan for CURRENT session
    const currentScan = existingScans?.find(s => s.session_name === sessionName)
    if (currentScan) {
        return {
            success: false,
            message: `Already scanned at ${new Date(currentScan.scanned_at).toLocaleTimeString()}`,
            attendeeName: reg.user.full_name,
            errorType: 'DUPLICATE'
        }
    }

    // 7. Check for MISSED previous sessions
    let missedSessions: string[] = []

    // We need the event's defined attendance sessions to know the expected timeline
    const { data: fullEventData } = await supabase
        .from('events')
        .select('attendance_sessions')
        .eq('id', targetEventId)
        .single()

    const allSessions = fullEventData?.attendance_sessions || []

    if (allSessions.length > 0) {
        // Find index of current session
        const currentIndex = allSessions.findIndex((s: any) => s.name === sessionName)

        if (currentIndex > 0) {
            // Check all sessions before this one
            for (let i = 0; i < currentIndex; i++) {
                const priorSessionName = allSessions[i].name
                if (!scannedSessionNames.includes(priorSessionName)) {
                    missedSessions.push(priorSessionName)
                }
            }
        }
    }

    // 8. Record Attendance for CURRENT session
    const { error: insertError } = await supabase
        .from('attendance')
        .insert({
            registration_id: registration.id,
            event_id: targetEventId,
            scanned_by: user.id,
            scanned_at: new Date().toISOString(),
            session_name: sessionName
        })

    if (insertError) {
        return { success: false, message: 'Database Error', errorType: 'INVALID' }
    }

    await logAction('SCAN_TICKET', 'attendance', registration.id, {
        sessionName,
        prev_state: 'absent',
        new_state: 'present'
    })

    return {
        success: true,
        message: 'Verified!',
        attendeeName: reg.user.full_name,
        teamMembers: registration.team_members || [],
        missedSessions: missedSessions.length > 0 ? missedSessions : undefined,
        registrationId: registration.id // Added so UI can trigger retroactive marking
    }
}

// New action to mark multiple missed sessions at once
export async function markSessionsPresent(registrationId: string, eventId: string, sessionsToMark: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const inserts = sessionsToMark.map(sessionName => ({
        registration_id: registrationId,
        event_id: eventId,
        scanned_by: user.id,
        scanned_at: new Date().toISOString(),
        session_name: sessionName,
        is_retroactive: true // Optional: if you add this column later to track manual overrides
    }))

    const { error } = await supabase
        .from('attendance')
        .insert(inserts)

    if (error) {
        console.error("Error retroactively marking attendance:", error)
        return { success: false, error: 'Database Error while marking past sessions' }
    }

    await logAction('MARK_ATTENDANCE_OVERRIDE', 'attendance', registrationId, {
        sessions: sessionsToMark,
        prev_state: 'absent',
        new_state: 'present'
    })

    return { success: true }
}
