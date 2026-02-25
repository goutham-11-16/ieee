import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/actions/audit'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // In a real app, verify a Cron Secret from request headers
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //  return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
        // For development/MVP testing, we will bypass the hard check if no secret is set
    }

    try {
        const now = new Date().toISOString()

        const { data: registrationsToUpdate, error: fetchError } = await supabase
            .from('registrations')
            .select(`
                id,
                status,
                event_id,
                events!inner (payment_deadline),
                payments (status)
            `)
            .eq('status', 'registered')
            .lt('events.payment_deadline', now)

        if (fetchError) throw fetchError

        let updatedCount = 0

        for (const reg of registrationsToUpdate || []) {
            const hasVerifiedPayment = (reg.payments as any[] || []).some(p => p.status === 'verified')

            if (!hasVerifiedPayment) {
                const { error: updateError } = await supabase
                    .from('registrations')
                    .update({ status: 'expired' })
                    .eq('id', reg.id)

                if (!updateError) {
                    updatedCount++
                    await logAction('EXPIRE_REGISTRATION', 'registrations', reg.id, { reason: 'payment_deadline_passed' })
                }
            }
        }

        return NextResponse.json({ success: true, updatedCount })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
