import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarIcon, MapPinIcon, DownloadIcon, UploadIcon, TicketIcon, UserIcon, ArrowLeftIcon, AlertCircleIcon, TicketCheckIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react'
import Link from 'next/link'
import PaymentUploadForm from './payment-form'
import { SuccessConfetti } from '@/components/ui/success-confetti'

export default async function StatusDashboardPage(props: {
    params: Promise<{ ref: string }>,
    searchParams: Promise<{ new?: string }>
}) {
    const params = await props.params
    const searchParams = await props.searchParams
    const isNew = searchParams.new === '1'
    const supabase = await createClient()
    const rawRef = params.ref.toUpperCase()

    const { data: registration } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            created_at,
            reference_number,
            guest_name,
            guest_email,
            ticket_qr_uuid,
            custom_responses,
            team_members,
            event:events (
                id,
                title,
                date,
                location,
                registration_end,
                payment_deadline,
                fees,
                is_fee_per_person,
                payment_qr_url,
                whatsapp_link,
                instagram_link
            ),
            payments (
                status,
                receipt_url,
                created_at
            ),
            attendance (
                check_in_time,
                check_out_time
            ),
            user:profiles!user_id(full_name, email)
        `)
        .eq('reference_number', rawRef)
        .single()

    if (!registration) {
        return (
            <div className="container mx-auto py-24 px-4 text-center space-y-4">
                <h1 className="text-3xl font-bold text-red-600">Reference Not Found</h1>
                <p className="text-muted-foreground">We could not find any registration matching '{rawRef}'.</p>
                <Button asChild>
                    <Link href="/status">Try Again</Link>
                </Button>
            </div>
        )
    }

    const reg = registration as any

    // Fallback logic for legacy vs new guest registrations
    const participantName = reg.guest_name || reg.user?.full_name || 'Guest Participant'
    const participantEmail = reg.guest_email || reg.user?.email || ''

    const payment = reg.payments && reg.payments.length > 0
        ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : undefined;
    const eventDate = new Date(reg.event.date)
    const isPaymentRequired = reg.event.fees > 0
    const isUnpaid = isPaymentRequired && (!payment || payment.status === 'unpaid')
    const isPending = payment?.status === 'pending_verification'
    const isVerified = payment?.status === 'verified'

    const { data: certificates } = await supabase
        .from('certificates')
        .select('unique_code, file_url, participant_name')
        .eq('registration_id', reg.id)

    // Check deadlines for payment
    const now = new Date()
    const deadlineStr = reg.event.payment_deadline || reg.event.registration_end || reg.event.date
    const deadline = new Date(deadlineStr)
    const missedPaymentDeadline = isUnpaid && now > deadline

    const checkedIn = reg.attendance?.[0]?.check_in_time
    const checkedOut = reg.attendance?.[0]?.check_out_time

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <Button variant="ghost" asChild className="mb-6 -ml-4">
                <Link href="/status">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back
                </Link>
            </Button>

            {isNew && <SuccessConfetti />}

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Registration Portal</h1>
                    <p className="text-muted-foreground mt-1">Ref: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-foreground">{reg.reference_number}</span></p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border px-4 py-2 rounded-lg">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                    <div>
                        <div className="font-medium text-sm">{participantName}</div>
                        <div className="text-xs text-muted-foreground">{participantEmail}</div>
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden mb-8">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl mb-2">{reg.event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-base">
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
                        <Badge className="text-sm px-3 py-1" variant={
                            reg.status === 'approved' ? 'success' :
                                reg.status === 'rejected' ? 'destructive' :
                                    reg.status === 'expired' ? 'outline' :
                                        reg.status === 'pending_approval' ? 'warning' : 'secondary'
                        }>
                            {reg.status === 'pending_approval' ? 'Approval Pending' : reg.status}
                        </Badge>
                    </div>
                </CardHeader>
                {isNew && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 p-6 flex flex-col items-center text-center">
                        <TicketCheckIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mb-3" />
                        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">Registration Successful!</h3>
                        <p className="text-emerald-800 dark:text-emerald-200">
                            Your reference number is <strong>{rawRef}</strong>. Please save this number.
                        </p>
                    </div>
                )}
                <CardContent className="pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left Column: Details & Attendance */}
                        <div className="space-y-8">
                            <section>
                                <h4 className="text-lg font-semibold border-b pb-2 mb-4">Event Details</h4>
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block mb-1">Registration Date</span>
                                        <span className="font-medium">{new Date(reg.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block mb-1">Event Fee</span>
                                        <span className="font-medium">{reg.event.fees > 0 ? `$${reg.event.fees}` : 'Free'}</span>
                                    </div>
                                    {reg.custom_responses && Object.entries(reg.custom_responses).map(([key, value]) => {
                                        // Retrieve label from schema if possible
                                        const schemaField = reg.event.form_schema?.find((f: any) => f.id === key);
                                        const label = schemaField ? schemaField.label : key;
                                        return (
                                            <div key={key} className="overflow-hidden">
                                                <span className="text-muted-foreground block mb-1">{label}</span>
                                                <span className="font-medium break-words whitespace-pre-wrap">{String(value)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {reg.team_members && reg.team_members.length > 0 && (
                                <section>
                                    <h4 className="text-lg font-semibold border-b pb-2 mb-4">Team Roster</h4>
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-3 rounded-lg flex items-center gap-3 hover:shadow-md transition-all duration-200">
                                            <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">L</div>
                                            <div>
                                                <p className="font-medium text-sm">{participantName} <Badge variant="outline" className="ml-2 text-[10px] h-4">Leader</Badge></p>
                                            </div>
                                        </div>
                                        {reg.team_members.map((member: any, idx: number) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg flex items-center gap-3 hover:shadow-md transition-all duration-200">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">{idx + 2}</div>
                                                <div>
                                                    <p className="font-medium text-sm">{member.guestName}</p>
                                                    <p className="text-xs text-muted-foreground">{member.guestEmail}</p>
                                                    {member.customResponses && Object.keys(member.customResponses).length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1">
                                                            {Object.entries(member.customResponses).map(([key, value]) => {
                                                                const schemaField = reg.event.form_schema?.find((f: any) => f.id === key);
                                                                const label = schemaField ? schemaField.label : key;
                                                                return (
                                                                    <div key={key} className="break-words whitespace-pre-wrap overflow-hidden"><span className="text-slate-500">{label}:</span> {String(value)}</div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h4 className="text-lg font-semibold border-b pb-2 mb-4">Attendance Tracker</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg">
                                        <span className="font-medium">Check-In</span>
                                        {checkedIn ? (
                                            <Badge variant="success">{new Date(checkedIn).toLocaleTimeString()}</Badge>
                                        ) : (
                                            <Badge variant="outline">Awaiting Scan</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg">
                                        <span className="font-medium">Check-Out</span>
                                        {checkedOut ? (
                                            <Badge variant="secondary">{new Date(checkedOut).toLocaleTimeString()}</Badge>
                                        ) : (
                                            <Badge variant="outline">--:--</Badge>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Payments & Actions */}
                        <div className="space-y-8">
                            <section>
                                <h4 className="text-lg font-semibold border-b pb-2 mb-4">Payment Status</h4>
                                {isPaymentRequired ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Current Status:</span>
                                            <Badge className="text-sm" variant={isVerified ? 'default' : isPending ? 'secondary' : missedPaymentDeadline ? 'destructive' : 'warning'}>
                                                {missedPaymentDeadline ? 'Expired' : payment?.status || 'Unpaid'}
                                            </Badge>
                                        </div>

                                        {isUnpaid && !missedPaymentDeadline && reg.status !== 'expired' && reg.status !== 'rejected' && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 border rounded-lg p-5 mt-4 shadow-sm">
                                                <div className="mb-4 text-center">
                                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount to Pay</p>
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                                                        ₹{(reg.event.fees * (reg.event.is_fee_per_person ? (1 + (reg.team_members?.length || 0)) : 1)).toFixed(2)}
                                                    </p>
                                                    {reg.event.is_fee_per_person && reg.team_members?.length > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            (₹{reg.event.fees.toFixed(2)} × {1 + reg.team_members.length} members)
                                                        </p>
                                                    )}
                                                </div>
                                                <PaymentUploadForm
                                                    registrationId={reg.id}
                                                    amount={reg.event.fees}
                                                    reference={reg.reference_number}
                                                    paymentQrUrl={reg.event.payment_qr_url}
                                                />
                                                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-left border border-blue-100 dark:border-blue-900/50">
                                                    <AlertCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                                    <p>
                                                        <strong>Note:</strong> If you close this page, you can always return to complete your payment using the <strong>Status Checker</strong> with your Reference Number (<strong>{rawRef}</strong>).
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {missedPaymentDeadline && (
                                            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded text-center">
                                                The payment deadline has passed.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg text-center border border-emerald-100">
                                        This event is completely free!
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-100 dark:bg-slate-900/80 flex justify-end gap-4 flex-wrap p-6 border-t">


                    {certificates && certificates.map((cert) => (
                        <Button key={cert.unique_code} variant="destructive" size="lg" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 shadow-sm" asChild>
                            <a href={supabase.storage.from('certificates').getPublicUrl(cert.file_url).data.publicUrl} target="_blank">
                                <DownloadIcon className="mr-2 h-4 w-4" /> Download Certificate ({cert.participant_name || 'Participant'})
                            </a>
                        </Button>
                    ))}

                    {(reg.status === 'approved' && (!isPaymentRequired || isVerified)) && (
                        <>
                            {reg.event.whatsapp_link && (
                                <Button size="lg" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white shadow-md transform transition-transform hover:-translate-y-1" asChild>
                                    <a href={reg.event.whatsapp_link} target="_blank" rel="noopener noreferrer">
                                        Join WhatsApp Group
                                    </a>
                                </Button>
                            )}
                            {reg.event.instagram_link && (
                                <Button size="lg" className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white shadow-md transform transition-transform hover:-translate-y-1" asChild>
                                    <a href={reg.event.instagram_link} target="_blank" rel="noopener noreferrer">
                                        Follow on Instagram
                                    </a>
                                </Button>
                            )}
                            <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-md transform transition-transform hover:-translate-y-1" asChild>
                                <Link href={`/tickets/${reg.id}`}>
                                    <TicketIcon className="mr-2 h-5 w-5" /> View Digital Ticket
                                </Link>
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
