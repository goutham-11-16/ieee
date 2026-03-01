import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Mapping valid export types to the relevant roles
    const type = request.nextUrl.searchParams.get('type') || 'registrations'

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let allowedRoles = ['admin', 'super_admin']
    if (type === 'payments') {
        allowedRoles.push('finance_admin')
    } else {
        allowedRoles.push('event_admin')
    } else if (type === 'certificates') {
        allowedRoles.push('content_admin')
    }

    if (!allowedRoles.includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    const { data: event } = await supabase.from('events').select('title, date').eq('id', eventId).single()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const doc = new jsPDF()
    const title = `${event.title} - ${type.charAt(0).toUpperCase() + type.slice(1)} Report`

    doc.setFontSize(20)
    doc.text(title, 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30)

    let head: string[][] = []
    let body: any[][] = []

    if (type === 'registrations') {
        const { data } = await supabase.from('registrations')
            .select('id, status, created_at, guest_name, guest_email, guest_phone, guest_reg_no, custom_responses, team_members, user:profiles!user_id(full_name, email)')
            .eq('event_id', eventId)

        head = [['Name', 'Email', 'Phone', 'Reg No', 'Role', 'Status']]
        const rawBody: any[][] = []
        const nowTime = new Date().getTime()


            ; (data || []).forEach((r: any) => {
                if (r.status === 'pending_payment' && r.expires_at) {
                    const expTime = new Date(r.expires_at).getTime()
                    if (nowTime > expTime) return
                }

                const leaderName = r.guest_name || r.user?.full_name || 'Guest'
                const leaderEmail = r.guest_email || r.user?.email || 'N/A'
                const phone = r.guest_phone || 'N/A'
                const regNo = r.guest_reg_no || 'N/A'

                rawBody.push([leaderName, leaderEmail, phone, regNo, 'Leader / Solo', r.status])

                if (r.team_members && Array.isArray(r.team_members)) {
                    r.team_members.forEach((m: any) => {
                        if (m.guestName) {
                            rawBody.push([`  -> ${m.guestName}`, m.guestEmail || 'N/A', m.guestPhone || 'N/A', m.guestRegNo || 'N/A', 'Team Member', r.status])
                        }
                    })
                }
            })
        body = rawBody
    } else if (type === 'attendance') {
        const { data } = await supabase.from('attendance')
            .select('check_in_time, check_out_time, session_name, registration:registrations(guest_name, guest_email, user:profiles!user_id(full_name, email))')
            .eq('event_id', eventId)

        head = [['Registration Lead', 'Email', 'Session', 'Check-in Time', 'Check-out Time']]
        body = (data || []).map((a: any) => {
            const reg = a.registration || {}
            return [
                reg.guest_name || reg.user?.full_name || 'N/A',
                reg.guest_email || reg.user?.email || 'N/A',
                a.session_name || 'Default Scan',
                a.check_in_time ? new Date(a.check_in_time).toLocaleString() : 'N/A',
                a.check_out_time ? new Date(a.check_out_time).toLocaleString() : 'N/A'
            ]
        })
    } else if (type === 'payments') {
        const { data: regs } = await supabase.from('registrations')
            .select('id, guest_name, user:profiles!user_id(full_name), payments(amount, status, transaction_reference, created_at, verified_at)')
            .eq('event_id', eventId)

        head = [['Name', 'Amount', 'Status', 'Reference', 'Date Generated']]
        body = (regs || []).flatMap((r: any) =>
            (r.payments || []).map((p: any) => [
                r.guest_name || r.user?.full_name || 'N/A',
                `$${p.amount}`,
                p.status.toUpperCase(),
                p.transaction_reference || 'N/A',
                new Date(p.created_at).toLocaleDateString()
            ])
        )
    } else if (type === 'certificates') {
        const { data: certs } = await supabase.from('certificates')
            .select('unique_code, participant_name, created_at, registration:registrations!inner(event_id)')
            .eq('registration.event_id', eventId)

        head = [['Participant Name', 'Certificate Code', 'Generated On']]
        body = (certs || []).map((c: any) => [
            c.participant_name || 'N/A',
            c.unique_code || 'N/A',
            new Date(c.created_at).toLocaleDateString()
        ])
    }

    autoTable(doc, {
        startY: 40,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    const pdfOutput = doc.output('arraybuffer')

    return new NextResponse(pdfOutput, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${event.title.replace(/\s+/g, '_')}_${type}.pdf"`
        }
    })
}
