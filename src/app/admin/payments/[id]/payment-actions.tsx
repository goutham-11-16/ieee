'use client'

import { useState } from 'react'
import { verifyPayment, rejectPayment } from './actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PaymentActions({ paymentId, registrationId }: { paymentId: string, registrationId: string }) {
    const [loading, setLoading] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [isRejectOpen, setIsRejectOpen] = useState(false)
    const router = useRouter()

    async function onVerify() {
        if (!confirm('Are you sure you want to verify this payment? This will generate a receipt.')) return

        setLoading(true)
        try {
            const result = await verifyPayment(paymentId, registrationId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment verified and receipt generated!')
                router.refresh()
            }
        } catch (e) {
            toast.error('Failed to verify payment')
        } finally {
            setLoading(false)
        }
    }

    async function onReject() {
        if (!rejectReason) {
            toast.error('Please provide a reason')
            return
        }

        setLoading(true)
        try {
            const result = await rejectPayment(paymentId, rejectReason)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment rejected.')
                setIsRejectOpen(false)
                router.refresh()
            }
        } catch (e) {
            toast.error('Failed to reject payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <Button onClick={onVerify} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircleIcon className="mr-2 h-4 w-4" />}
                Verify Payment
            </Button>

            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" disabled={loading} className="w-full">
                        <XCircleIcon className="mr-2 h-4 w-4" /> Reject Payment
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this payment. The user will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea
                            placeholder="e.g. Transaction ID invalid, Amount mismatch..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={onReject} disabled={loading}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
