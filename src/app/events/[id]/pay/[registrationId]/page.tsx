import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TimedPaymentClient from './timed-payment-client'

export default async function TimedPaymentPage(props: { params: Promise<{ id: string, registrationId: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // 1. Fetch Registration
    const { data: registration } = await supabase
        .from('registrations')
        .select(`
            *,
            event:events(id, title, date, location, fees, is_fee_per_person, payment_qr_url, max_capacity)
        `)
        .eq('id', params.registrationId)
        .eq('event_id', params.id)
        .single()

    if (!registration) {
        notFound()
    }

    const event = (registration as any).event

    // 2. State Validations
    if (registration.status === 'expired') {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4">Registration Expired</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                    Your 5-minute payment window has expired. The reserved seats have been released back to the public pool.
                </p>
                <div className="mt-8">
                    <a href={`/events/${params.id}`} className="text-blue-600 font-semibold hover:underline">
                        Return to Event Page
                    </a>
                </div>
            </div>
        )
    }

    if (registration.status !== 'pending_payment') {
        // If they already paid or it's free, send them straight to the ticket receipt
        redirect(`/status/${registration.reference_number}`)
    }

    // Double check backend timer
    if (registration.expires_at) {
        const now = new Date().getTime()
        const exp = new Date(registration.expires_at).getTime()
        if (now > exp) {
            // Auto-expire on refresh if time is up
            await supabase.from('registrations').update({ status: 'expired' }).eq('id', params.registrationId)
            redirect(`/events/${params.id}`)
        }
    }

    // 3. Calculate Final Computed Amount
    let finalAmount = event.fees || 0
    if (event.is_fee_per_person) {
        const teamCount = Array.isArray(registration.team_members) ? registration.team_members.length : 0
        finalAmount = event.fees * (1 + teamCount)
    }

    return (
        <div className="container max-w-5xl mx-auto py-12 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Complete Your Payment</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            You have successfully registered for <strong>{event.title}</strong>.
                            Your seat is temporarily reserved. Complete the payment to confirm your ticket.
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">Registration Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Name</span>
                                <span className="font-medium">{registration.guest_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Reg No</span>
                                <span className="font-medium">{registration.guest_reg_no || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Team Size</span>
                                <span className="font-medium">{Array.isArray(registration.team_members) ? registration.team_members.length + 1 : 1} Members</span>
                            </div>
                        </div>

                        <div className="border-t my-4"></div>

                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                            <span className="font-semibold text-blue-900 dark:text-blue-200">Total Required</span>
                            <span className="text-xl font-black text-blue-700 dark:text-blue-400">₹{finalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <TimedPaymentClient
                        registrationId={registration.id}
                        eventId={event.id}
                        referenceNumber={registration.reference_number}
                        amount={finalAmount}
                        paymentQrUrl={event.payment_qr_url}
                        expiresAt={registration.expires_at}
                        eventTitle={event.title}
                    />
                </div>
            </div>
        </div>
    )
}
