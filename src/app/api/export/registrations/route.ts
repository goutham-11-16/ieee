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
      user:profiles!user_id(full_name, email),
      event:events(title, date),
      payment:payments(amount, status, transaction_reference)
    `)
        .order('created_at', { ascending: false })

    if (!registrations) {
        return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    // Convert to CSV
    const headers = ['Registration ID', 'User Name', 'Email', 'Event', 'Event Date', 'Status', 'Payment Status', 'Amount', 'Transaction Ref', 'Date Registered']
    const rows = registrations.map((reg: any) => [
        reg.id,
        reg.user?.full_name || 'N/A',
        reg.user?.email || 'N/A',
        reg.event?.title || 'N/A',
        new Date(reg.event?.date).toLocaleDateString(),
        reg.status,
        reg.payment?.[0]?.status || 'N/A', // Assuming array or object depending on join
        reg.payment?.[0]?.amount || 0,
        reg.payment?.[0]?.transaction_reference || 'N/A',
        new Date(reg.created_at).toLocaleString()
    ])

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
