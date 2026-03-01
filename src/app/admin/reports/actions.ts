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
            reference_number,
            guest_name,
            guest_email,
            guest_phone,
            guest_reg_no,
            team_members,
            user:profiles!user_id(full_name, email),
            created_at,
            payments(amount, transaction_ref, proof_url, status),
            attendance(session_name, check_in_time)
        `)
        .eq('event_id', eventId)
        .in('status', ['approved', 'pending_approval', 'pending_payment'])

    if (!registrations || registrations.length === 0) return { error: 'No data found' }

    // Log Action
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'EXPORT_REPORT',
        entity_type: 'events',
        entity_id: eventId,
        new_values: { type: 'participants_csv' }
    })

    // Dynamic Headers
    const headers = ['Ref No', 'Name', 'Email', 'Phone', 'Reg No', 'Type', 'Status', 'Registered At', 'Payment Amount', 'Payment UTR', 'Payment Proof', 'Payment Status']
    sessions.forEach((s: any) => {
        headers.push(`${s.name} Scanned At`)
    })

    const rows: string[][] = []

    registrations.forEach(reg => {
        const u = reg.user as any
        const pList = reg.payments as any[]
        const aList = reg.attendance as any[]

        // Grab latest payment if exists
        const latestPayment = pList && pList.length > 0 ? pList[0] : null

        const leaderName = reg.guest_name || u?.full_name || 'N/A'
        const leaderEmail = reg.guest_email || u?.email || 'N/A'

        const attendanceRow = sessions.map((sess: any) => {
            const scan = aList?.find((a: any) => a.session_name === sess.name)
            return scan ? new Date(scan.check_in_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Absent'
        })

        // Ensure string encapsulation
        const baseRow = [
            reg.reference_number || 'N/A',
            `"${leaderName.replace(/"/g, '""')}"`,
            `"${leaderEmail}"`,
            `"${reg.guest_phone || 'N/A'}"`,
            `"${reg.guest_reg_no || 'N/A'}"`,
            'Primary',
            reg.status,
            new Date(reg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            latestPayment?.amount || '0',
            latestPayment?.transaction_ref ? `"${latestPayment.transaction_ref}"` : 'N/A',
            latestPayment?.proof_url || 'N/A',
            latestPayment?.status || 'N/A',
            ...attendanceRow
        ]

        rows.push(baseRow)

        // Output distinct rows for valid team members
        const teamMembers = Array.isArray(reg.team_members) ? reg.team_members : []
        teamMembers.forEach((m: any) => {
            if (m.guestName) {
                // Team members just get blanks for payment and status columns
                const memberRow = [
                    reg.reference_number || 'N/A',
                    `"${m.guestName.replace(/"/g, '""')}"`,
                    `"${m.guestEmail || 'N/A'}"`,
                    `"${m.guestPhone || 'N/A'}"`,
                    `"${m.guestRegNo || 'N/A'}"`,
                    'Team Member',
                    '', '', '', '', '', '',
                    ...sessions.map(() => '') // Blanks for attendance columns for team members
                ]
                rows.push(memberRow)
            }
        })
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
            reference_number,
            guest_name,
            guest_email,
            guest_phone,
            guest_reg_no,
            team_members,
            user:profiles!user_id(full_name, email),
            created_at,
            payments(amount, transaction_ref, proof_url, status),
            attendance(session_name, check_in_time)
        `)
        .eq('event_id', eventId)
        .in('status', ['approved', 'pending_approval', 'pending_payment'])

    if (!registrations || registrations.length === 0) return { error: 'No data found' }

    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'EXPORT_REPORT',
        entity_type: 'events',
        entity_id: eventId,
        new_values: { type: 'participants_pdf' }
    })

    const columns = [
        { header: 'Ref No', width: 60, field: 'refNo' },
        { header: 'Name', width: 100, field: 'name' },
        { header: 'Status', width: 50, field: 'status' },
        { header: 'Type', width: 60, field: 'type' },
    ]

    // Create a dynamic column for each attendance session
    sessions.forEach((s: any, idx: number) => {
        columns.push({ header: `Att ${idx + 1}`, width: 45, field: `att_${idx}` })
    })

    const rowData: any[] = []
    let totalHumans = 0
    let totalLeads = 0

    registrations.forEach(r => {
        const u = r.user as any
        const pList = r.payments as any[]
        const aList = r.attendance as any[]
        const latestPayment = pList && pList.length > 0 ? pList[0] : null

        const leaderName = r.guest_name || u?.full_name || 'N/A'

        totalLeads++
        totalHumans++

        const row: any = {
            refNo: r.reference_number || '-',
            name: leaderName,
            status: r.status,
            type: 'Primary',
        }

        sessions.forEach((sess: any, idx: number) => {
            const scan = aList?.find((a: any) => a.session_name === sess.name)
            row[`att_${idx}`] = scan ? 'Present' : '-'
        })

        rowData.push(row)

        const teamMembers = Array.isArray(r.team_members) ? r.team_members : []
        teamMembers.forEach((m: any) => {
            if (m.guestName) {
                totalHumans++
                const memberRow: any = {
                    refNo: '-', // share primary ref
                    name: `  • ${m.guestName}`,
                    status: '-',
                    type: 'Team Member'
                }

                // Add blank attendance trackers for visual spacing
                sessions.forEach((sess: any, idx: number) => {
                    memberRow[`att_${idx}`] = ''
                })

                rowData.push(memberRow)
            }
        })

        // Add visual empty spacer between teams
        if (teamMembers.filter((m: any) => m.guestName).length > 0) {
            rowData.push({
                refNo: '', name: '', status: '', type: '', att_0: ''
            })
        }
    })

    const pdfBuffer = await createReportPDF(
        'Participants List',
        [
            `Event: ${eventData.title}`,
            `Date: ${eventData.date ? new Date(eventData.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : 'N/A'}`,
            `Generated By: ${user.email}`,
            `Total Regs: ${totalLeads} | Total Participants: ${totalHumans}`
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
