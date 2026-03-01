import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DownloadIcon, MapPinIcon, CalendarIcon, AlertTriangleIcon } from 'lucide-react'
import Link from 'next/link'
import PrintButton from './print-button'

export default async function TicketPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch registration with event and PAYMENT details
    const { data: registration } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            ticket_qr_uuid,
            user_id,
            guest_name,
            user:profiles!user_id(full_name, email),
            event:events(
                id,
                title,
                date,
                location,
                fees,
                banner_url
            ),
            payments(status, created_at)
        `)
        .eq('id', params.id)
        .single()

    if (!registration) {
        notFound()
    }

    // Authorization: 
    // 1. If the registration belongs to a registered user (user_id is not null)
    if (registration.user_id) {
        if (!user) {
            redirect('/login')
        }
        if (registration.user_id !== user.id) {
            // TODO: specific admin check if needed, but for now strict owner.
            return (
                <div className="container mx-auto py-20 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                </div>
            )
        }
    }
    // 2. If user_id is null, it's a guest registration. Anyone with the obscure UUID link can view it (like the Status Checker link).

    // Cast for easier access
    interface RegistrationDetail {
        id: string;
        status: string;
        ticket_qr_uuid: string;
        user_id: string;
        guest_name?: string;
        user: { full_name: string; email: string };
        event: {
            id: string;
            title: string;
            date: string;
            location: string;
            fees: number;
            banner_url: string;
        };
        payments: { status: string; created_at: string }[];
    }
    const reg = registration as any;
    const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
    const profile = Array.isArray(reg.user) ? reg.user[0] : reg.user;

    if (!event) {
        notFound();
    }

    // PAYMENT VALIDATION
    const isPaidEvent = event.fees > 0
    const latestPayment = reg.payments && reg.payments.length > 0
        ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;
    const paymentStatus = latestPayment?.status
    const isVerified = paymentStatus === 'verified'

    // Rule: No Payment = No QR (unless free event)
    // Rule: Must be approved OR have a verified payment
    const isApproved = reg.status === 'approved'
    const canViewTicket = (isApproved || isVerified) && (!isPaidEvent || isVerified)

    if (!canViewTicket) {
        return (
            <div className="container mx-auto py-20 px-4 max-w-md">
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertTriangleIcon className="w-6 h-6" />
                            Ticket Not Available
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Your ticket is not ready yet. This could be because:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            {(!isApproved && !isVerified) && <li>Your registration is still <strong>pending approval</strong>.</li>}
                            {(isPaidEvent && !isVerified) && <li>Your payment has not been <strong>verified</strong> yet.</li>}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    const qrData = JSON.stringify({
        regId: reg.id,
        uuid: reg.ticket_qr_uuid,
        event: event.id
    })

    return (
        <div className="container mx-auto py-10 px-4 flex justify-center">
            <Card className="w-full max-w-sm shadow-2xl overflow-hidden border-0 relative bg-white dark:bg-slate-900">
                {/* Visual Header */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

                <div className="p-8 text-center space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Admit One</h2>
                        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
                            {event.title}
                        </h1>
                    </div>

                    <div className="bg-white p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 inline-block">
                        <QRCodeSVG value={qrData} size={200} level="H" includeMargin />
                    </div>

                    <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(event.date).toLocaleString()}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <MapPinIcon className="w-4 h-4" />
                            {event.location || 'Location TBA'}
                        </div>
                        <div className="border-t pt-4">
                            <p className="font-semibold">{reg.guest_name || profile?.full_name}</p>
                            <p className="text-xs text-muted-foreground text-ellipsis overflow-hidden">{reg.id}</p>
                        </div>
                    </div>
                </div>

                {/* Ticket Cutout Effect */}
                <div className="absolute left-0 top-1/2 -translate-x-1/2 w-8 h-8 bg-gray-50 dark:bg-black rounded-full" />
                <div className="absolute right-0 top-1/2 translate-x-1/2 w-8 h-8 bg-gray-50 dark:bg-black rounded-full" />
                <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-gray-800 -z-10" />

                <CardFooter className="bg-slate-50 dark:bg-slate-950 p-4 flex justify-center">
                    <PrintButton />
                </CardFooter>
            </Card>
        </div>
    )
}
