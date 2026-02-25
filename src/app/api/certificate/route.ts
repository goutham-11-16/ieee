import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCertificate } from '@/lib/certificates'

export async function GET(request: NextRequest) {
    // Extract registrationId from search params since this is a route handler not a page
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('reg_id')

    if (!registrationId) {
        return NextResponse.json({ error: 'Missing registration ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify ownership or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: reg } = await supabase
        .from('registrations')
        .select('*, event:events(title, date), user:profiles!user_id(full_name)')
        .eq('id', registrationId)
        .single()

    if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check valid status
    if (reg.status !== 'approved') { // OR attended
        return NextResponse.json({ error: 'Certificate not available yet' }, { status: 403 })
    }

    // Generate PDF
    const pdfBytes = await generateCertificate(
        reg.user.full_name,
        reg.event.title,
        new Date(reg.event.date).toLocaleDateString()
    )

    // Return PDF stream
    return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="certificate-${reg.event.title}.pdf"`,
        },
    })
}
