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
                team_members,
                user:profiles!registrations_user_id_fkey(full_name, email),
                event:events(id, title, fees, is_fee_per_person, date)
            )
        `)
        .eq('id', params.id)
        .single()

    if (!payment) {
        notFound()
    }

    // Join Normalization
    const reg = Array.isArray(payment.registration) ? payment.registration[0] : payment.registration;

    if (!reg) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-red-600">Registration Not Found</h1>
                <p className="mt-4 text-muted-foreground">This payment record is not associated with any valid registration.</p>
            </div>
        )
    }

    const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
    const profile = Array.isArray(reg.user) ? reg.user[0] : reg.user;

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
    } else if (publicUrl && (publicUrl.includes('drive.google.com/file/d/') || publicUrl.includes('drive.google.com/uc?'))) {
        isGoogleDrive = true;
        let fileId = '';
        const matchFileD = publicUrl.match(/\/d\/(.+?)\//);
        const matchUc = publicUrl.match(/id=([^&]+)/);
        if (matchFileD && matchFileD[1]) {
            fileId = matchFileD[1];
        } else if (matchUc && matchUc[1]) {
            fileId = matchUc[1];
        }

        if (fileId) {
            publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
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
                                        <iframe
                                            src={previewUrl}
                                            className="w-full h-full absolute inset-0 rounded-lg border-0"
                                            allow="autoplay"
                                            title="Payment Proof Document"
                                        />
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
                                <span>{reg.guest_name || profile?.full_name || "Unknown User"} <br /> <span className="text-xs text-muted-foreground">{reg.guest_email || profile?.email || "No email"}</span></span>

                                <span className="text-muted-foreground">Event:</span>
                                <span>{event?.title || "Unknown Event"}</span>

                                <span className="text-muted-foreground">Event Fee:</span>
                                <span>₹{event?.fees || 0} {event?.is_fee_per_person ? '(per person)' : ''}</span>

                                <span className="text-muted-foreground">Expected Total:</span>
                                <span className="font-bold text-blue-600">
                                    ₹{((event?.fees || 0) *
                                        (event?.is_fee_per_person ? (1 + (reg.team_members?.length || 0)) : 1)).toFixed(2)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {payment.status === 'pending_verification' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PaymentActions paymentId={payment.id} registrationId={reg.id} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
