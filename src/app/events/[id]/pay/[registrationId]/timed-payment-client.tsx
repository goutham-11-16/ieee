'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadTimedPaymentProof, expireRegistration } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircleIcon, ClockIcon } from 'lucide-react'
import { compressImage } from '@/lib/image-compression'
import { getDriveImageUrl } from '@/lib/utils'

interface TimedPaymentClientProps {
    registrationId: string;
    amount: number;
    paymentQrUrl?: string | null;
    expiresAt: string; // ISO string
    referenceNumber: string;
    eventId: string;
    eventTitle: string;
}

export default function TimedPaymentClient({ registrationId, amount, paymentQrUrl, expiresAt, referenceNumber, eventId, eventTitle }: TimedPaymentClientProps) {
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('')
    const [timeLeft, setTimeLeft] = useState<{ minutes: number, seconds: number }>({ minutes: 5, seconds: 0 })
    const [expired, setExpired] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime()
            const exp = new Date(expiresAt).getTime()
            const diff = exp - now

            if (diff <= 0) {
                setExpired(true)
                setTimeLeft({ minutes: 0, seconds: 0 })
                // Trigger backend expiration if it hits exactly 0 while they are watching
                expireRegistration(registrationId).then(() => {
                    toast.error('Session expired. Your seat has been released.')
                    router.push(`/events/${eventId}`)
                })
            } else {
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const s = Math.floor((diff % (1000 * 60)) / 1000)
                setTimeLeft({ minutes: m, seconds: s })
            }
        }

        updateTimer() // run once immediately
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [expiresAt, registrationId, eventId, router])

    async function onSubmit(formData: FormData) {
        if (expired || loading) return

        setLoading(true)
        setLoadingText('Preparing upload...')
        try {
            let file = formData.get('proof') as File;
            const transactionRef = formData.get('transactionRef') as string;

            if (!file || file.size === 0) {
                toast.error('Please select a file to upload.');
                setLoading(false);
                return;
            }

            // Compress image if applicable
            if (file.type.startsWith('image/')) {
                setLoadingText('Compressing image...')
                file = await compressImage(file, { maxSizeMB: 0.1, maxWidthOrHeight: 800 });
            }

            if (!file || file.size === 0) {
                toast.error('Please select a file to upload.');
                setLoading(false);
                return;
            }

            // 1. Convert File to Base64
            setLoadingText('Converting to Base64...')
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = (error) => reject(error);
            });

            // 2. Upload to Google Drive via Apps Script
            setLoadingText('Uploading to Google Drive...')
            const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
            if (!scriptUrl) {
                throw new Error("Missing NEXT_PUBLIC_GOOGLE_SCRIPT_URL environment variable.");
            }

            const uploadPayload = {
                base64Data: base64Data,
                filename: file.name,
                mimeType: file.type,
                eventTitle: eventTitle // Inform the script of the event name
            };

            const uploadResponse = await fetch(scriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(uploadPayload)
            });

            const rawText = await uploadResponse.text();
            let uploadResult;
            try {
                uploadResult = JSON.parse(rawText);
            } catch (e) {
                toast.error("Upload failed: Invalid response from server.");
                setLoading(false);
                return;
            }

            if (!uploadResult.success) {
                toast.error('Failed to upload file to Drive: ' + uploadResult.error);
                setLoading(false);
                return;
            }

            const driveUrl = uploadResult.fileId ? `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}` : uploadResult.url;

            // 3. Save Payment Record in Supabase
            setLoadingText('Saving database record...')
            const serverFormData = new FormData();
            serverFormData.append('registrationId', registrationId);
            serverFormData.append('amount', amount.toString());
            serverFormData.append('transactionRef', transactionRef);
            serverFormData.append('proofUrl', driveUrl);

            const result = await uploadTimedPaymentProof(serverFormData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment submitted successfully! Generating ticket...')
                router.push(`/status/${referenceNumber}?new=1`);
            }
        } catch (e) {
            console.error(e);
            toast.error('Something went wrong during upload.')
        } finally {
            setLoading(false)
            setLoadingText('')
        }
    }

    if (expired) {
        return (
            <div className="flex flex-col justify-center items-center py-12 text-center">
                <AlertCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Session Expired</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">You ran out of time to complete the payment. Your reserved seat has been released.</p>
                <Button onClick={() => router.push(`/events/${eventId}`)}>Return to Event</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-lg p-4 flex flex-col items-center justify-center animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-widest text-sm">Do Not Refresh</span>
                </div>
                <div className="text-4xl font-black text-red-700 dark:text-red-500 tracking-tighter tabular-nums">
                    {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <p className="text-xs text-red-500 mt-2 font-medium">Your seat is reserved for this duration.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border shadow-inner">
                <div className="text-center mb-6">
                    <p className="text-sm text-slate-500 mb-1">Amount to Pay</p>
                    <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">₹{amount.toFixed(2)}</p>
                </div>

                {paymentQrUrl && (
                    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black rounded-xl mb-6 shadow-sm border">
                        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">Scan QR to Pay</p>
                        <img src={getDriveImageUrl(paymentQrUrl)} alt="Payment QR Code" className="w-56 h-56 object-contain" />
                    </div>
                )}

                <form action={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="transactionRef">Transaction / UTR Number</Label>
                        <Input id="transactionRef" name="transactionRef" required placeholder="e.g. UPI12345678" className="bg-white dark:bg-slate-950" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="proof">Upload Payment Screenshot</Label>
                        <Input id="proof" name="proof" type="file" required accept="image/*,.pdf" className="bg-white dark:bg-slate-950" />
                        <p className="text-xs text-slate-500">Must clearly show the UTR number and Amount.</p>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-all" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {loading ? (loadingText || 'Verifying Upload...') : 'Submit Payment Proof'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
