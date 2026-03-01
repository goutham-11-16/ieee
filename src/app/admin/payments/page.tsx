import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PaymentSearchForm from './search-form'
import { CheckCircleIcon, XCircleIcon, InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import PendingPaymentsList from './pending-payments-list'

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
        .in('status', ['pending', 'pending_verification'])
        .order('created_at', { ascending: false })

    const eventData = registration?.event ? (Array.isArray(registration.event) ? registration.event[0] : registration.event) : null
    const userData = registration?.user ? (Array.isArray(registration.user) ? registration.user[0] : registration.user) : null

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">Payment Verification</h1>
            <p className="text-muted-foreground">Verify and approve digital payment proofs uploaded by users.</p>

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
                            {registration.payments && registration.payments.some((p: any) => p.status === 'verified') ? (
                                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                    <CheckCircleIcon className="w-6 h-6 shrink-0" />
                                    <div>
                                        <p className="font-bold text-lg">Payment Verified</p>
                                        <p className="text-sm">This registration has already been paid and verified by an admin.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Online Payment Check */}
                                    {registration.payments?.find((p: any) => p.status === 'pending_verification') ? (
                                        <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div>
                                                    <p className="font-bold text-blue-900 text-lg mb-1">Online Payment Pending Verification</p>
                                                    <p className="text-blue-800 text-sm">A payment proof has been uploaded and is waiting for review.</p>
                                                </div>
                                                <Button size="lg" className="shrink-0 font-bold bg-blue-600 hover:bg-blue-700 shadow-md" asChild>
                                                    <Link href={`/admin/payments/${registration.payments.find((p: any) => p.status === 'pending_verification').id}`}>
                                                        Review Online Proof
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-slate-700 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                            <InfoIcon className="w-6 h-6 shrink-0" />
                                            <div>
                                                <p className="font-bold text-lg">No Online Proof Found</p>
                                                <p className="text-sm">The user hasn't uploaded any payment receipt yet. They must upload proof via the Registration Status page before it can be verified online.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending Online Payments Section */}
            <div className="pt-8">
                <PendingPaymentsList initialPayments={(pendingPayments || []) as any} />
            </div>
        </div>
    )
}

