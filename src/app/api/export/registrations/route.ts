import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Verify Admin
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ideally check role here too

    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
      id,
      status,
      created_at,
      guest_name,
      guest_email,
      guest_phone,
      guest_institution,
      guest_reg_no,
      team_members,
      custom_responses,
      user:profiles!user_id(full_name, email),
      event:events(title, date),
      payment:payments(amount, status, transaction_reference)
    `)
        .order('created_at', { ascending: false })

    if (!registrations) {
        return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    // Convert to CSV
    const headers = ['Registration ID', 'Leader Name', 'Leader Email', 'Phone', 'Institution', 'Reg No', 'Event', 'Event Date', 'Status', 'Payment Status', 'Amount', 'Date Registered', 'Team Size', 'Custom Responses']
    const rows = registrations.map((reg: any) => {
        const teamCount = Array.isArray(reg.team_members) ? reg.team_members.length : 0;
        let customResponsesStr = '';
        if (reg.custom_responses) {
            try {
                customResponsesStr = Object.entries(reg.custom_responses).map(([k, v]) => `${k}: ${v}`).join(' | ');
            } catch (e) { }
        }

        return [
            reg.id,
            reg.guest_name || reg.user?.full_name || 'N/A',
            reg.guest_email || reg.user?.email || 'N/A',
            reg.guest_phone || 'N/A',
            reg.guest_institution || 'N/A',
            reg.guest_reg_no || 'N/A',
            reg.event?.title || 'N/A',
            new Date(reg.event?.date).toLocaleDateString(),
            reg.status,
            reg.payment?.[0]?.status || 'N/A',
            reg.payment?.[0]?.amount || 0,
            new Date(reg.created_at).toLocaleString(),
            teamCount,
            customResponsesStr
        ]
    })

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="registrations.csv"'
        }
    })
}
