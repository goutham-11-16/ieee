'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadPaymentProof } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface PaymentUploadProps {
    registrationId: string;
    amount: number;
    paymentQrUrl?: string | null;
}

export default function PaymentUploadForm({ registrationId, amount, paymentQrUrl }: PaymentUploadProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function onSubmit(formData: FormData) {
        setLoading(true)
        try {
            const file = formData.get('proof') as File;
            const transactionRef = formData.get('transactionRef') as string;

            if (!file || file.size === 0) {
                toast.error('Please select a file to upload.');
                setLoading(false);
                return;
            }

            // 1. Convert File to Base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove the Data URL prefix (e.g., "data:image/png;base64,")
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = (error) => reject(error);
            });

            // 2. Upload to Google Drive via Apps Script
            const scriptUrl = 'https://script.google.com/macros/s/AKfycbyVmM0XuzqXc7cjLRA7ksUmAKvNxwkClKHlbjupPKjlLM7AIYrLOB17rlb_02BlI-Sixg/exec';

            const uploadPayload = {
                base64Data: base64Data,
                filename: file.name,
                mimeType: file.type
            };

            const uploadResponse = await fetch(scriptUrl, {
                method: 'POST',
                // Important: Use text/plain or application/x-www-form-urlencoded to avoid CORS preflight issues with some GAS setups,
                // but application/json usually works if doOptions is setup (which it is in the provided script).
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify(uploadPayload)
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                toast.error('Failed to upload file to Drive: ' + uploadResult.error);
                setLoading(false);
                return;
            }

            const driveUrl = uploadResult.url;

            // 3. Save Payment Record in Supabase
            // We pass the driveUrl to the server action instead of the file
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

            <form action={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="transactionRef">Transaction Reference ID</Label>
                    <Input id="transactionRef" name="transactionRef" required placeholder="e.g. UPI12345678" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="proof">Upload Screenshot (Image/PDF)</Label>
                    <Input id="proof" name="proof" type="file" required accept="image/*,.pdf" />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processing Upload...' : 'Submit Payment for Verification'}
                </Button>
            </form>
        </div>
    )
}
