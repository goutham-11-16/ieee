import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarIcon, MapPinIcon, DownloadIcon, UploadIcon, TicketIcon, Ghost, SearchX } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            expires_at,
            created_at,
            ticket_qr_uuid,
            event:events (
                id,
                title,
                date,
                location,
                registration_end,
                fees
            ),
            payments (
                status,
                receipt_url,
                created_at
            )
        `)
        .eq('user_id', user.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const { data: certificates } = await supabase
        .from('certificates')
        .select('registration_id, unique_code, file_url')
        .in('registration_id', registrations?.map((r: any) => r.id) || [])

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

            <div className="grid gap-6">
                {registrations?.map((reg: any) => {
                    const nowTime = new Date().getTime()
                    if (reg.status === 'pending_payment' && reg.expires_at) {
                        const expTime = new Date(reg.expires_at).getTime()
                        if (nowTime > expTime) reg.status = 'expired'
                    }

                    const payment = reg.payments && reg.payments.length > 0
                        ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                        : undefined;
                    const eventDate = new Date(reg.event.date)
                    const isPyamentRequired = reg.event.fees > 0
                    const isUnpaid = isPyamentRequired && (!payment || payment.status === 'unpaid')
                    const isPending = payment?.status === 'pending_verification'
                    const isVerified = payment?.status === 'verified'

                    return (
                        <Card key={reg.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl mb-2">{reg.event.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="w-4 h-4" />
                                                {eventDate.toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {reg.event.location || 'TBA'}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant={
                                        reg.status === 'approved' ? 'success' :
                                            reg.status === 'rejected' ? 'destructive' :
                                                reg.status === 'expired' ? 'outline' :
                                                    reg.status === 'pending_approval' ? 'warning' : 'secondary'
                                    }>
                                        {reg.status === 'pending_approval' ? 'Approval Pending' : reg.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Registration Details</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">ID:</span> {reg.id.slice(0, 8)}...
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Fee:</span> {reg.event.fees > 0 ? `₹${reg.event.fees}` : 'Free'}
                                                </div>
                                                {reg.event.registration_end && (
                                                    <div className="col-span-2 text-amber-600 font-medium">
                                                        Deadline: {new Date(reg.event.registration_end).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 pl-0 md:pl-6 border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment & Ticket</h4>

                                        {isPyamentRequired ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Status:</span>
                                                    <Badge variant={isVerified ? 'default' : isPending ? 'secondary' : 'destructive'}>
                                                        {payment?.status || 'Unpaid'}
                                                    </Badge>
                                                </div>

                                                {isUnpaid && reg.status !== 'expired' && reg.status !== 'rejected' && (
                                                    <Button className="w-full" asChild>
                                                        <Link href={`/dashboard/pay/${reg.id}`}>
                                                            <UploadIcon className="mr-2 h-4 w-4" /> Upload Payment Proof
                                                        </Link>
                                                    </Button>
                                                )}

                                                {isPending && (
                                                    <div className="text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 p-2 rounded text-center">
                                                        Your payment is being verified by an admin.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-green-600 font-medium">No Payment Required</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 flex-wrap">
                                {payment?.receipt_url && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={supabase.storage.from('receipts').getPublicUrl(payment.receipt_url).data.publicUrl} target="_blank">
                                            <DownloadIcon className="mr-2 h-4 w-4" /> Receipt
                                        </a>
                                    </Button>
                                )}

                                {(() => {
                                    const cert = certificates?.find((c: any) => c.registration_id === reg.id)
                                    if (cert) {
                                        return (
                                            <Button variant="default" size="sm" asChild>
                                                <a href={supabase.storage.from('certificates').getPublicUrl(cert.file_url).data.publicUrl} target="_blank">
                                                    <DownloadIcon className="mr-2 h-4 w-4" /> Certificate
                                                </a>
                                            </Button>
                                        )
                                    }
                                    return null
                                })()}

                                {(reg.status === 'approved' && (!isPyamentRequired || isVerified)) && (
                                    <Button size="sm" asChild>
                                        <Link href={`/tickets/${reg.id}`}>
                                            <TicketIcon className="mr-2 h-4 w-4" /> View Ticket
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}

                {(!registrations || registrations.length === 0) && (
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed shadow-inner mt-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-6">
                            <SearchX className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Registrations Yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            You haven't registered for any upcoming events. Discover what's happening and secure your spot today!
                        </p>
                        <Button asChild size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
                            <Link href="/events">Explore Events</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
