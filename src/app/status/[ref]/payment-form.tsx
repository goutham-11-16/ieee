'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveGoogleDrivePayment } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
            const proofFile = formData.get('proof') as File

            if (!proofFile || proofFile.size === 0) {
                toast.error('Please select an image to upload.')
                setLoading(false)
                return
            }

            // 1. Convert to Base64
            const base64Data = await toBase64(proofFile)

            // Construct filename as ref-utr.extension
            const ext = proofFile.name.split('.').pop()
            const customFilename = `${reference}-${transactionRef}.${ext}`

            // 2. Upload to Google Apps Script
            const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL

            if (!googleScriptUrl) {
                toast.error("Google Apps Script URL is not configured.")
                setLoading(false)
                return
            }

            toast.info("Uploading securely to Google Drive...")

            const response = await fetch(googleScriptUrl, {
                method: "POST",
                body: JSON.stringify({
                    base64: base64Data,
                    filename: customFilename,
                    mimeType: proofFile.type
                })
            })

            const text = await response.text()
            let resultData;
            try {
                resultData = JSON.parse(text)
            } catch (e) {
                throw new Error("Invalid response from Google Drive Integration")
            }

            if (!resultData.success) {
                throw new Error(resultData.error || "Failed to upload to Google Drive")
            }

            // 3. Save link to Supabase
            const dbResult = await saveGoogleDrivePayment(registrationId, amount.toString(), transactionRef, resultData.url)

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
                    <img src={paymentQrUrl} alt="Payment QR Code" className="w-48 h-48 object-contain bg-white p-2 rounded-md shadow-sm" />
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4 text-left">
                <div className="space-y-2">
                    <Label htmlFor="transactionRef">Transaction / UTR Number</Label>
                    <Input id="transactionRef" name="transactionRef" required placeholder="e.g. UPI12345678" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="proof">Upload Screenshot (Image/PDF)</Label>
                    <Input id="proof" name="proof" type="file" required accept="image/*,.pdf" />
                    <p className="text-xs text-muted-foreground">Files will be securely stored in our Google Drive.</p>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processing Upload...' : 'Submit Payment for Verification'}
                </Button>
            </form>
        </div>
    )
}
