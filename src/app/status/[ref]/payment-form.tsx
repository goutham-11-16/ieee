'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveGoogleDrivePayment } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getDriveImageUrl } from '@/lib/utils'
import { DriveImageUploader } from '@/components/ui/drive-image-uploader'

interface PaymentUploadProps {
    registrationId: string;
    amount: number;
    reference: string;
    paymentQrUrl?: string | null;
}

export default function PaymentUploadForm({ registrationId, amount, reference, paymentQrUrl }: PaymentUploadProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve((reader.result as string).split(',')[1]) // Get only the base64 part
        reader.onerror = error => reject(error)
    })

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(event.currentTarget)
            const transactionRef = formData.get('transactionRef') as string
            const proofUrl = formData.get('proofUrl') as string

            if (!proofUrl) {
                toast.error('Please upload an image first.')
                setLoading(false)
                return
            }

            // 3. Save link to Supabase
            const dbResult = await saveGoogleDrivePayment(registrationId, amount.toString(), transactionRef, proofUrl)

            if (dbResult.error) {
                toast.error(dbResult.error)
            } else {
                toast.success('Payment proof uploaded successfully!')
                router.refresh()
            }
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Something went wrong during upload')
        } finally {
            setLoading(false)
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

            <form onSubmit={onSubmit} className="space-y-4 text-left">
                <div className="space-y-2">
                    <Label htmlFor="transactionRef">Transaction / UTR Number</Label>
                    <Input id="transactionRef" name="transactionRef" required placeholder="e.g. UPI12345678" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="proofUrl">Upload Screenshot (Image/PDF)</Label>
                    <DriveImageUploader id="proofUrl" name="proofUrl" folderName="Payment Proof" eventTitle="Manual Payment" required />
                    <p className="text-xs text-muted-foreground">Files will be securely stored in our Google Drive.</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processing Upload...' : 'Submit Payment for Verification'}
                </Button>
            </form>
        </div>
    )
}
