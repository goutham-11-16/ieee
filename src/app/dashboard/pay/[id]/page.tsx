import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import PaymentUploadForm from './payment-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PaymentPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: registration } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            event:events (
                id,
                title,
                fees,
                registration_end,
                payment_deadline,
                date,
                payment_qr_url
            ),
            payments (
                status,
                created_at
            )
        `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

    if (!registration) {
        notFound()
    }

    // Cast to expected type
    interface RegistrationDetail {
        id: string;
        event: {
            id: string;
            title: string;
            fees: number;
            registration_end: string;
            payment_deadline: string;
            date: string;
            payment_qr_url: string;
        };
        payments: { status: string; created_at: string }[];
    }
    const reg = registration as unknown as RegistrationDetail;

    // Check deadlines
    const now = new Date()
    // Use payment_deadline if available, otherwise registration_end, otherwise event date
    const deadlineStr = reg.event.payment_deadline || reg.event.registration_end || reg.event.date
    const deadline = new Date(deadlineStr)

    if (now > deadline) {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Deadline Missed</h1>
                <p className="text-muted-foreground">The payment window for this event closed on {deadline.toLocaleString()}.</p>
                <p className="text-sm mt-4 text-gray-500">If you believe this is an error, please contact the event admin.</p>
            </div>
        )
    }

    // Check if already paid/verified
    const latestPayment = reg.payments && reg.payments.length > 0
        ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

    if (latestPayment?.status === 'verified' || latestPayment?.status === 'pending_verification') {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Payment Already Submitted</h1>
                <p className="text-muted-foreground">Your payment is either verified or pending verification.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Payment Proof</CardTitle>
                    <CardDescription>
                        Event: {reg.event.title}
                        <br />
                        Amount Due: <span className="font-bold text-foreground">₹{reg.event.fees.toFixed(2)}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-6 bg-slate-100 dark:bg-slate-800 p-3 rounded">
                        Please transfer the fee to the club bank account (Details below) and upload the screenshot/receipt.
                        <br /><br />
                        <strong>Bank:</strong> Club Bank<br />
                        <strong>Account:</strong> 1234567890<br />
                        <strong>Ref:</strong> {reg.event.id.slice(0, 4)}-{user.id.slice(0, 4)}
                    </p>
                    <PaymentUploadForm registrationId={reg.id} amount={reg.event.fees} paymentQrUrl={reg.event.payment_qr_url} />
                </CardContent>
            </Card>
        </div>
    )
}
