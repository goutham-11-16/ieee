import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { verifyPayment, rejectPayment } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, DownloadIcon } from 'lucide-react'
import PaymentActions from './payment-actions'

export default async function PaymentReviewPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    const { data: payment } = await supabase
        .from('payments')
        .select(`
            *,
            registration:registrations (
                id,
                status,
                guest_name,
                guest_email,
                user:profiles!registrations_user_id_fkey(full_name, email),
                event:events(id, title, fees, date)
            )
        `)
        .eq('id', params.id)
        .single()

    if (!payment) {
        notFound()
    }

    // Get public URL for proof
    let publicUrl = payment.proof_url || '';
    let previewUrl = publicUrl;
    let isGoogleDrive = false;

    if (publicUrl && !publicUrl.startsWith('http')) {
        // Fallback for older uploads to Supabase
        const { data } = supabase.storage
            .from('payment_proofs')
            .getPublicUrl(publicUrl);
        publicUrl = data.publicUrl;
        previewUrl = data.publicUrl;
    } else if (publicUrl && publicUrl.includes('drive.google.com/file/d/')) {
        // Convert Google Drive viewer links to direct image embed links
        isGoogleDrive = true;
        const match = publicUrl.match(/\/d\/(.+?)\//);
        if (match && match[1]) {
            publicUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
            previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/payments">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Review Payment</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proof Viewer */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Payment Proof</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border flex flex-col items-center justify-center p-4 text-center">
                            {publicUrl ? (
                                <>
                                    <span className="mb-4 text-muted-foreground">
                                        Payment Proof Document
                                    </span>
                                    {isGoogleDrive ? (
                                        <Button asChild>
                                            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                                Open in Google Drive
                                            </a>
                                        </Button>
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt="Payment Proof"
                                            className="object-contain w-full h-full absolute inset-0"
                                        />
                                    )}
                                </>
                            ) : (
                                <span className="mb-2 text-muted-foreground">No Proof Available</span>
                            )}
                        </div>
                        {publicUrl && (
                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                    <DownloadIcon className="mr-2 h-4 w-4" /> Download / Open Original
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Details & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-semibold text-lg">₹{payment.amount}</span>

                                <span className="text-muted-foreground">Ref ID:</span>
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{payment.transaction_reference}</span>

                                <span className="text-muted-foreground">Date:</span>
                                <span>{new Date(payment.created_at).toLocaleString()}</span>

                                <span className="text-muted-foreground">Status:</span>
                                <Badge>{payment.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>User & Event</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">User:</span>
                                <span>{payment.registration.guest_name || (Array.isArray(payment.registration.user) ? payment.registration.user[0]?.full_name : payment.registration.user?.full_name) || "Unknown User"} <br /> <span className="text-xs text-muted-foreground">{payment.registration.guest_email || (Array.isArray(payment.registration.user) ? payment.registration.user[0]?.email : payment.registration.user?.email) || "No email"}</span></span>

                                <span className="text-muted-foreground">Event:</span>
                                <span>{(Array.isArray(payment.registration.event) ? payment.registration.event[0]?.title : payment.registration.event?.title) || "Unknown Event"}</span>

                                <span className="text-muted-foreground">Event Fee:</span>
                                <span>₹{(Array.isArray(payment.registration.event) ? payment.registration.event[0]?.fees : payment.registration.event?.fees) || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {payment.status === 'pending' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PaymentActions paymentId={payment.id} registrationId={payment.registration.id} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
