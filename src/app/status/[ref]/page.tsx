import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
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
    const supabase = createAdminClient()
    const rawRef = params.ref.toUpperCase()

    // 1. Try fetching by reference_number
    let { data: registration } = await supabase
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
            event_id,
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
                instagram_link,
                attendance_sessions,
                form_schema
            ),
            payments (
                status,
                receipt_url,
                created_at
            ),
            attendance (
                check_in_time,
                check_out_time,
                session_name
            ),
            user:profiles!user_id(full_name, email)
        `)
        .eq('reference_number', rawRef)
        .maybeSingle()

    // 2. If not found by ref, try by ID (fallback for edge cases)
    if (!registration && rawRef.length > 20) {
        const { data: byId } = await supabase.from('registrations').select('reference_number').eq('id', params.ref).maybeSingle()
        if (byId?.reference_number) {
            redirect(`/status/${byId.reference_number}`)
        }
    }

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

    // 3. Graceful Redirect: If the URL ref doesn't match the latest reference_number, redirect
    if (registration.reference_number && registration.reference_number.toUpperCase() !== rawRef) {
        redirect(`/status/${registration.reference_number}`)
    }

    const reg = registration as any

    // --- Join Normalization (Supabase returns arrays for some relation types) ---
    const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
    const user = Array.isArray(reg.user) ? reg.user[0] : reg.user;

    // Final defensive check against null event (prevents render crash)
    if (!event) {
        console.error("Status page: Event details missing for registration", reg.id)
        return (
            <div className="container py-24 px-4 text-center">
                <h1 className="text-2xl font-bold text-red-600">Event Not Found</h1>
                <p className="mt-4 text-muted-foreground">The event associated with this registration could not be loaded. Please contact support.</p>
            </div>
        )
    }

    // Fallback logic for legacy vs new guest registrations
    const participantName = reg.guest_name || user?.full_name || 'Guest Participant'
    const participantEmail = reg.guest_email || user?.email || ''

    // Ensure relations that might return as single objects are properly wrapped in arrays
    const rawPayments = reg.payments || [];
    const paymentsRecords = Array.isArray(rawPayments) ? rawPayments : [rawPayments];

    const rawAttendance = reg.attendance || [];
    const attendanceRecords = Array.isArray(rawAttendance) ? rawAttendance : [rawAttendance];

    const rawTeam = reg.team_members || [];
    const teamMembers = Array.isArray(rawTeam) ? rawTeam : [];

    const verifiedPayment = paymentsRecords.find((p: any) => p.status === 'verified');
    const payment = verifiedPayment || (paymentsRecords.length > 0
        ? [...paymentsRecords].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : undefined);

    const eventDate = event?.date ? new Date(event.date) : new Date();
    const isPaymentRequired = (event?.fees || 0) > 0
    const paymentRejected = payment && payment.status === 'rejected'
    const isUnpaid = isPaymentRequired && (!payment || payment.status === 'unpaid' || paymentRejected)
    const isPending = payment?.status === 'pending_verification'
    const isVerified = payment?.status === 'verified'

    // Fetch certificates for this registration if they exist
    const { data: certificates } = await supabase
        .from('certificates')
        .select('unique_code, file_url, participant_name')
        .eq('registration_id', reg.id)

    // Check deadlines for payment
    const now = new Date()
    const deadlineStr = event.payment_deadline || event.registration_end || event.date
    const deadline = new Date(deadlineStr)
    const missedPaymentDeadline = isUnpaid && now > deadline

    const checkedIn = attendanceRecords[0]?.check_in_time
    const checkedOut = attendanceRecords[0]?.check_out_time

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
                            <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-base">
                                <span className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    {eventDate.toLocaleDateString('en-GB')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPinIcon className="w-4 h-4" />
                                    {event.location || 'TBA'}
                                </span>
                            </CardDescription>
                        </div>
                        <Badge className="text-sm px-3 py-1" variant={
                            (reg.status === 'approved' || isVerified) ? 'success' :
                                reg.status === 'rejected' ? 'destructive' :
                                    reg.status === 'expired' ? 'outline' :
                                        reg.status === 'pending_approval' ? 'warning' : 'secondary'
                        }>
                            {(reg.status === 'approved' || isVerified) ? 'Approved' :
                                reg.status === 'pending_approval' ? 'Approval Pending' :
                                    reg.status.replace('_', ' ')}
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
                                        <span className="font-medium">{new Date(reg.created_at).toLocaleDateString('en-GB')}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block mb-1">Event Fee</span>
                                        <span className="font-medium">{event.fees > 0 ? `₹${event.fees}` : 'Free'}</span>
                                    </div>
                                    {reg.custom_responses && Object.entries(reg.custom_responses).map(([key, value]) => {
                                        // Retrieve label from schema if possible
                                        const schemaField = event.form_schema?.find((f: any) => f.id === key);
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

                            {teamMembers.length > 0 && (
                                <section>
                                    <h4 className="text-lg font-semibold border-b pb-2 mb-4">Team Roster</h4>
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-3 rounded-lg flex items-center gap-3 hover:shadow-md transition-all duration-200">
                                            <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">L</div>
                                            <div>
                                                <p className="font-medium text-sm">{participantName} <Badge variant="outline" className="ml-2 text-[10px] h-4">Leader</Badge></p>
                                            </div>
                                        </div>
                                        {teamMembers.map((member: any, idx: number) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg flex items-center gap-3 hover:shadow-md transition-all duration-200">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">{idx + 2}</div>
                                                <div>
                                                    <p className="font-medium text-sm">{member.guestName}</p>
                                                    <p className="text-xs text-muted-foreground">{member.guestEmail}</p>
                                                    {member.customResponses && Object.keys(member.customResponses).length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1">
                                                            {Object.entries(member.customResponses).map(([key, value]) => {
                                                                const schemaField = event.form_schema?.find((f: any) => f.id === key);
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
                                    {event.attendance_sessions && event.attendance_sessions.length > 0 ? (
                                        event.attendance_sessions.map((session: any) => {
                                            const sessionName = typeof session === 'string' ? session : session.name;
                                            const sessionId = typeof session === 'string' ? session : (session.id || session.name);
                                            const sessionRecord = attendanceRecords.find((a: any) => a.session_name === sessionName) || null;
                                            return (
                                                <div key={sessionId} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg">
                                                    <div className="font-semibold text-sm border-b pb-1">{sessionName}</div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                                                        {sessionRecord?.check_in_time ? (
                                                            <Badge variant="success">Present - {new Date(sessionRecord.check_in_time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Absent / Awaiting</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg">
                                                <span className="font-medium">Check-In</span>
                                                {checkedIn ? (
                                                    <Badge variant="success">{new Date(checkedIn).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</Badge>
                                                ) : (
                                                    <Badge variant="outline">Awaiting Scan</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg">
                                                <span className="font-medium">Check-Out</span>
                                                {checkedOut ? (
                                                    <Badge variant="secondary">{new Date(checkedOut).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</Badge>
                                                ) : (
                                                    <Badge variant="outline">--:--</Badge>
                                                )}
                                            </div>
                                        </>
                                    )}
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
                                            <Badge className="text-sm" variant={isVerified ? 'default' : isPending ? 'secondary' : missedPaymentDeadline ? 'destructive' : paymentRejected ? 'destructive' : 'warning'}>
                                                {missedPaymentDeadline ? 'Expired' : payment?.status || 'Unpaid'}
                                            </Badge>
                                        </div>

                                        {isUnpaid && !missedPaymentDeadline && reg.status !== 'expired' && reg.status !== 'rejected' && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 border rounded-lg p-5 mt-4 shadow-sm">
                                                {paymentRejected && (
                                                    <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded flex items-start gap-2 text-red-800 dark:text-red-300">
                                                        <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                                                        <div className="text-sm">
                                                            <strong className="block mb-1">Payment Rejected</strong>
                                                            Your previous payment proof was rejected by the admin. Please verify the amount and upload a correct, clear screenshot of the transaction.
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="mb-4 text-center">
                                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount to Pay</p>
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                                                        ₹{(event.fees * (event.is_fee_per_person ? (1 + teamMembers.length) : 1)).toFixed(2)}
                                                    </p>
                                                    {event.is_fee_per_person && teamMembers.length > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            (₹{event.fees.toFixed(2)} × {1 + teamMembers.length} members)
                                                        </p>
                                                    )}
                                                </div>
                                                <PaymentUploadForm
                                                    registrationId={reg.id}
                                                    amount={event.fees}
                                                    reference={reg.reference_number}
                                                    paymentQrUrl={event.payment_qr_url}
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
            </Card>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
                <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                    <div className="hidden md:block flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">Ref: {reg.reference_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{event.title}</p>
                    </div>

                    <div className="w-full md:w-auto flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap shrink-0">
                        {certificates && certificates.map((cert) => (
                            <Button key={cert.unique_code} variant="destructive" size="default" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 shadow-sm" asChild>
                                <a href={supabase.storage.from('certificates').getPublicUrl(cert.file_url).data.publicUrl} target="_blank">
                                    <DownloadIcon className="mr-2 h-4 w-4" /> Download Certificate ({cert.participant_name || 'Participant'})
                                </a>
                            </Button>
                        ))}

                        {((reg.status === 'approved' || isVerified)) && (
                            <>
                                {event.whatsapp_link && (
                                    <Button size="default" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white shadow-md transform transition-transform hover:-translate-y-0.5" asChild>
                                        <a href={event.whatsapp_link} target="_blank" rel="noopener noreferrer">
                                            Join WhatsApp Group
                                        </a>
                                    </Button>
                                )}
                                {event.instagram_link && (
                                    <Button size="default" className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white shadow-md transform transition-transform hover:-translate-y-0.5" asChild>
                                        <a href={event.instagram_link} target="_blank" rel="noopener noreferrer">
                                            Follow on Instagram
                                        </a>
                                    </Button>
                                )}
                                <Button size="default" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-md transform transition-transform hover:-translate-y-0.5" asChild>
                                    <Link href={`/tickets/${reg.id}`}>
                                        <TicketIcon className="mr-2 h-5 w-5" /> View Digital Ticket
                                    </Link>
                                </Button>
                            </>
                        )}

                        {!(reg.status === 'approved' || isVerified) && (!certificates || certificates.length === 0) && (
                            <div className="w-full text-center md:text-right text-sm text-muted-foreground italic">
                                Action locked until approval
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom spacer to prevent content hiding behind sticky nav */}
            <div className="h-24"></div>
        </div>
    )
}
