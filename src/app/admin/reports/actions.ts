'use server'

import { createClient } from '@/lib/supabase/server'
import { createReportPDF } from '@/lib/pdf-helper'

export async function exportParticipantsCSV(eventId: string) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch Event Data to get Sessions
    const { data: eventData } = await supabase
        .from('events')
        .select('title, attendance_sessions')
        .eq('id', eventId)
        .single()

    if (!eventData) return { error: 'Event not found' }

    const sessions = eventData.attendance_sessions || []

    // Fetch Data with Relations
    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            user:profiles!user_id(full_name, email),
            created_at,
            payments(amount, transaction_ref, proof_url, status),
            attendance(session_name, check_in_time)
        `)
        .eq('event_id', eventId)

    if (!registrations) return { error: 'No data found' }

    // Log Action
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'EXPORT_REPORT',
        entity_type: 'events',
        entity_id: eventId,
        new_values: { type: 'participants_csv' }
    })

    // Dynamic Headers
    const headers = ['Name', 'Email', 'Status', 'Registered At', 'Payment Amount', 'Payment UTR', 'Payment Proof', 'Payment Status']
    sessions.forEach((s: any) => {
        headers.push(`${s.name} Scanned At`)
    })

    const rows = registrations.map(reg => {
        const u = reg.user as any
        const pList = reg.payments as any[]
        const aList = reg.attendance as any[]

        // Grab latest payment if exists
        const latestPayment = pList && pList.length > 0 ? pList[0] : null

        const baseRow = [
            u?.full_name ? `"${u.full_name.replace(/"/g, '""')}"` : 'N/A',
            u?.email || 'N/A',
            reg.status,
            new Date(reg.created_at).toLocaleString(),
            latestPayment?.amount || '0',
            latestPayment?.transaction_ref ? `"${latestPayment.transaction_ref}"` : 'N/A',
            latestPayment?.proof_url || 'N/A',
            latestPayment?.status || 'N/A'
        ]

        // Dynamic Attendance Columns
        const attendanceRow = sessions.map((sess: any) => {
            const scan = aList?.find((a: any) => a.session_name === sess.name)
            return scan ? new Date(scan.check_in_time).toLocaleString() : 'Absent'
        })

        return [...baseRow, ...attendanceRow]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return { success: true, data: csvContent, filename: `participants-${eventId}.csv` }
}

export async function exportParticipantsPDF(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch Event Data to get Sessions
    const { data: eventData } = await supabase
        .from('events')
        .select('title, attendance_sessions, date')
        .eq('id', eventId)
        .single()

    if (!eventData) return { error: 'Event not found' }

    const sessions = eventData.attendance_sessions || []

    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
            status,
            user:profiles!user_id(full_name, email),
            created_at,
            payments(amount, transaction_ref, proof_url, status),
            attendance(session_name, check_in_time)
        `)
        .eq('event_id', eventId)

    if (!registrations || registrations.length === 0) return { error: 'No data found' }

    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'EXPORT_REPORT',
        entity_type: 'events',
        entity_id: eventId,
        new_values: { type: 'participants_pdf' }
    })

    const columns = [
        { header: 'Name', width: 120, field: 'name' },
        { header: 'Email', width: 150, field: 'email' },
        { header: 'Status', width: 70, field: 'status' },
        { header: 'Payment', width: 70, field: 'paymentAmount' },
        { header: 'UTR', width: 100, field: 'utr' }
    ]

    // Create a dynamic column for each attendance session
    sessions.forEach((s: any, idx: number) => {
        columns.push({ header: `Att ${idx + 1}`, width: 60, field: `att_${idx}` })
    })

    const rowData = registrations.map(r => {
        const u = r.user as any
        const pList = r.payments as any[]
        const aList = r.attendance as any[]
        const latestPayment = pList && pList.length > 0 ? pList[0] : null

        const row: any = {
            name: u?.full_name || 'N/A',
            email: u?.email || 'N/A',
            status: r.status,
            paymentAmount: latestPayment?.amount ? `Rs ${latestPayment.amount}` : '-',
            utr: latestPayment?.transaction_ref || '-'
        }

        sessions.forEach((sess: any, idx: number) => {
            const scan = aList?.find((a: any) => a.session_name === sess.name)
            row[`att_${idx}`] = scan ? 'Present' : '-'
        })

        return row
    })

    const pdfBuffer = await createReportPDF(
        'Participants List',
        [
            `Event: ${eventData.title}`,
            `Date: ${eventData.date ? new Date(eventData.date).toLocaleDateString('en-GB') : 'N/A'}`,
            `Generated By: ${user.email}`,
            `Total: ${registrations.length}`
        ],
        columns,
        rowData
    )

    // Return Base64 for client download
    return {
        success: true,
        data: pdfBuffer.toString('base64'),
        filename: `participants-${eventId}.pdf`
    }
}
