import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PaymentSearchForm from './search-form'
import { CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { markRegistrationAsPaid } from './actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminPaymentsPage(props: { searchParams: Promise<{ ref?: string }> }) {
    const searchParams = await props.searchParams
    const ref = searchParams?.ref
    const supabase = await createClient()

    let registration = null
    let errorMsg = null

    if (ref) {
        const { data, error } = await supabase
            .from('registrations')
            .select(`
                id,
                reference_number,
                guest_name,
                guest_email,
                status,
                team_members,
                event:events(id, title, fees, is_fee_per_person),
                payments(id, status, receipt_url),
                user:profiles!user_id(full_name, email)
            `)
            .eq('reference_number', ref)
            .single()

        if (error || !data) {
            errorMsg = "No registration found with this reference number. Please check the typing and try again."
        } else {
            registration = data as any // bypass TS strict checking for raw supabase joins
        }
    }

    const { data: pendingPayments } = await supabase
        .from('payments')
        .select(`
            id,
            amount,
            created_at,
            registration:registrations(guest_name, user:profiles!registrations_user_id_fkey(full_name, email), event:events(title))
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false })

    const eventData = registration?.event ? (Array.isArray(registration.event) ? registration.event[0] : registration.event) : null
    const userData = registration?.user ? (Array.isArray(registration.user) ? registration.user[0] : registration.user) : null

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">Offline Payment verification</h1>
            <p className="text-muted-foreground">Search by Reference Number to approve in-person payments.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Search Registration</CardTitle>
                </CardHeader>
                <CardContent>
                    <PaymentSearchForm />
                </CardContent>
            </Card>

            {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    <p className="font-semibold flex items-center">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        {errorMsg}
                    </p>
                </div>
            )}

            {registration && (
                <Card className="border-2 border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle>Registration Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-muted-foreground mb-1">Name:</p>
                                <p className="font-semibold text-lg break-words">{registration.guest_name || userData?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Email:</p>
                                <p className="font-medium break-words">{registration.guest_email || userData?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Event:</p>
                                <p className="font-medium break-words">{eventData?.title}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Amount Due:</p>
                                <p className="font-bold text-2xl text-blue-600">
                                    ₹{(eventData?.fees * (eventData?.is_fee_per_person ? (1 + (registration.team_members?.length || 0)) : 1)).toFixed(2)}
                                </p>
                                {eventData?.is_fee_per_person && (registration.team_members?.length || 0) > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        (₹{eventData.fees} × {1 + registration.team_members.length} members)
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Registration Status:</p>
                                <Badge variant={registration.status === 'approved' ? 'default' : 'secondary'} className="uppercase">
                                    {registration.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Ref ID:</p>
                                <p className="font-mono bg-slate-100 p-1 rounded inline-block break-words max-w-full">{registration.reference_number}</p>
                            </div>
                        </div>

                        <div className="border-t pt-6 mt-6">
                            {(registration.payments && registration.payments.length > 0 && registration.payments.some((p: any) => p.status === 'verified')) ? (
                                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                    <CheckCircleIcon className="w-6 h-6 shrink-0" />
                                    <div>
                                        <p className="font-bold text-lg">Payment Verified</p>
                                        <p className="text-sm">This registration has already been paid and verified by an admin.</p>
                                    </div>
                                </div>
                            ) : (
                                <form action={async () => {
                                    'use server'
                                    await markRegistrationAsPaid(registration.id)
                                }}>
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800">
                                            <p className="font-semibold mb-1">Manual Verification Required</p>
                                            <p className="text-sm">Verify that you have received the correct payment of exactly <b>₹{(eventData?.fees * (eventData?.is_fee_per_person ? (1 + (registration.team_members?.length || 0)) : 1)).toFixed(2)}</b> from the registrant before clicking confirm.</p>
                                        </div>
                                        <Button className="w-full h-auto py-4 text-base md:text-lg font-bold shadow-md whitespace-normal" size="lg" disabled={eventData?.fees <= 0}>
                                            <CheckCircleIcon className="w-6 h-6 mr-2 shrink-0" />
                                            <span>{eventData?.fees <= 0 ? 'Event is Free (No Payment Needed)' : 'Confirm Offline Verification & Mark as Paid'}</span>
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending Online Payments Section */}
            <div className="pt-8">
                <h2 className="text-2xl font-bold mb-4">Pending Online Payments</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Needs Verification</CardTitle>
                        <p className="text-sm text-muted-foreground">Payments uploaded by users via the Status Checker waiting for admin review.</p>
                    </CardHeader>
                    <CardContent>
                        {pendingPayments && pendingPayments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-900">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Guest Name</th>
                                            <th className="px-4 py-3">Event</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingPayments.map((p) => {
                                            // Handle TS strictness for joins
                                            const reg = p.registration as any
                                            const evt = Array.isArray(reg?.event) ? reg.event[0] : reg?.event
                                            const profile = Array.isArray(reg?.user) ? reg.user[0] : reg?.user

                                            return (
                                                <tr key={p.id} className="border-b dark:border-slate-800">
                                                    <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-medium">
                                                        {reg?.guest_name || profile?.full_name || 'Unknown User'}<br />
                                                        <span className="text-xs text-muted-foreground font-normal">{reg?.guest_email || profile?.email || 'No email'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">{evt?.title || 'Unknown'}</td>
                                                    <td className="px-4 py-3">₹{p.amount}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/admin/payments/${p.id}`}>Review Proof</Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No pending online payments right now. You are all caught up!
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
