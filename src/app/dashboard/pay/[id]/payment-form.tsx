'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadPaymentProof } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getDriveImageUrl } from '@/lib/utils'
import { DriveImageUploader } from '@/components/ui/drive-image-uploader'

interface PaymentUploadProps {
    registrationId: string;
    amount: number;
    paymentQrUrl?: string | null;
}

export default function PaymentUploadForm({ registrationId, amount, paymentQrUrl }: PaymentUploadProps) {
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('')
    const router = useRouter()

    async function onSubmit(formData: FormData) {
        if (loading) return
        setLoading(true)
        setLoadingText('Preparing upload...')
        try {
            const driveUrl = formData.get('proofUrl') as string;
            const transactionRef = formData.get('transactionRef') as string;

            if (!driveUrl) {
                toast.error('Please upload a payment proof first.');
                setLoading(false);
                return;
            }

            setLoadingText('Saving database record...')
            const serverFormData = new FormData();
            serverFormData.append('registrationId', registrationId);
            serverFormData.append('amount', amount.toString());
            serverFormData.append('transactionRef', transactionRef);
            serverFormData.append('proofUrl', driveUrl); // Passing the new URL

            const result = await uploadPaymentProof(serverFormData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment proof uploaded successfully!')
                router.push('/dashboard')
            }
        } catch (e) {
            console.error(e);
            toast.error('Something went wrong during upload.')
        } finally {
            setLoading(false)
            setLoadingText('')
        }
    }

    return (
        <div className="space-y-6">
            {paymentQrUrl && (
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <p className="text-sm font-medium mb-3 text-center">Scan this QR Code to Pay</p>
                    <img src={getDriveImageUrl(paymentQrUrl)} alt="Payment QR Code" className="w-48 h-48 object-contain bg-white p-2 rounded-md shadow-sm" />
                </div>
            )}

            <form action={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="transactionRef">Transaction Reference ID</Label>
                    <Input id="transactionRef" name="transactionRef" required placeholder="e.g. UPI12345678" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="proofUrl">Upload Screenshot (Image/PDF)</Label>
                    <DriveImageUploader id="proofUrl" name="proofUrl" folderName="Payment Proof" eventTitle="Manual Payment" required />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? (loadingText || 'Processing Upload...') : 'Submit Payment for Verification'}
                </Button>
            </form>
        </div>
    )
}
