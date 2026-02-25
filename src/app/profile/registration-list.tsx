'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadPaymentProof } from './payment-actions'
import { toast } from 'sonner'
import Ticket from '@/components/ticket'

type Registration = {
    id: string
    status: string
    event: {
        title: string
        date: string
        location: string
    }
    payment?: {
        status: string
        transaction_reference: string
    }
}

export default function RegistrationList({ registrations }: { registrations: Registration[] }) {
    return (
        <div className="space-y-4">
            {registrations.map((reg) => (
                <Card key={reg.id}>
                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-semibold text-lg">{reg.event.title}</h3>
                            <p className="text-sm text-gray-500">
                                {new Date(reg.event.date).toLocaleDateString()} • {reg.event.location}
                            </p>
                            <div className="mt-2 flex gap-2">
                                <Badge variant={reg.status === 'approved' ? 'default' : 'secondary'}>
                                    Registration: {reg.status}
                                </Badge>
                                {reg.payment && (
                                    <Badge variant="outline">
                                        Payment: {reg.payment.status}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {!reg.payment && reg.status !== 'cancelled' && reg.status !== 'rejected' && (
                            <PaymentDialog registrationId={reg.id} eventTitle={reg.event.title} />
                        )}

                        {reg.status === 'approved' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="ml-2">View Ticket</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>Your Ticket</DialogTitle>
                                    </DialogHeader>
                                    <Ticket
                                        eventTitle={reg.event.title}
                                        date={reg.event.date}
                                        location={reg.event.location}
                                        userName="Participant"
                                        qrCodeValue={reg.id}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardContent>
                </Card>
            ))}
            {registrations.length === 0 && (
                <p className="text-muted-foreground">No registrations found.</p>
            )}
        </div>
    )
}

function PaymentDialog({ registrationId, eventTitle }: { registrationId: string, eventTitle: string }) {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const res = await uploadPaymentProof(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Payment proof uploaded successfully')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Upload Payment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Offline Payment for {eventTitle}</DialogTitle>
                    <DialogDescription>
                        Please transfer the amount to the club bank account and upload the transaction details here.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="registrationId" value={registrationId} />

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount Paid</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transactionRef">Transaction Reference ID</Label>
                        <Input id="transactionRef" name="transactionRef" required placeholder="e.g. TXN12345678" />
                    </div>

                    {/* In a real app, this would be type="file" */}
                    <div className="space-y-2">
                        <Label htmlFor="proofUrl">Proof URL (Mock)</Label>
                        <Input id="proofUrl" name="proofUrl" placeholder="https://..." />
                    </div>

                    <Button type="submit" className="w-full">Submit Proof</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
