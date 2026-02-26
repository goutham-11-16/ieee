'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { forceMarkPaid, forceMarkAttended } from './actions'
import { toast } from 'sonner'
import { Loader2, BanknoteIcon, CheckSquareIcon } from 'lucide-react'

interface OverrideProps {
    registrationId: string
    eventId?: string
    isPaid: boolean
    isAttended: boolean
}

export function AdminOverrideButtons({ registrationId, eventId, isPaid, isAttended }: OverrideProps) {
    const [loadingPayment, setLoadingPayment] = useState(false)
    const [loadingAttendance, setLoadingAttendance] = useState(false)

    const handleForcePay = async () => {
        if (!confirm('Are you sure you want to FORCE MARK this participant as PAID? This bypasses the normal payment flow.')) return
        setLoadingPayment(true)
        try {
            const res = await forceMarkPaid(registrationId)
            if (res.success) {
                toast.success('Participant successfully marked as PAID.')
            } else {
                toast.error(res.error || 'Failed to update payment status.')
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoadingPayment(false)
        }
    }

    const handleForceAttend = async () => {
        if (!confirm('Are you sure you want to FORCE MARK this participant as ATTENDED? This bypasses physical QR scanning.')) return
        setLoadingAttendance(true)
        try {
            if (!eventId) throw new Error('Event ID is missing.')
            const res = await forceMarkAttended(registrationId, eventId)
            if (res.success) {
                toast.success('Participant successfully checked in.')
            } else {
                toast.error(res.error || 'Failed to update attendance status.')
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoadingAttendance(false)
        }
    }

    if (isPaid && isAttended) return null // Nothing to override if both are perfect

    return (
        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/50 mb-8">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-800 dark:text-amber-500 flex items-center gap-2">
                    Super Admin Overrides
                </CardTitle>
                <CardDescription className="text-amber-700/80 dark:text-amber-400/80">
                    Use these controls to bypass standard procedures for exceptional cases.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                {!isPaid && (
                    <Button
                        variant="default"
                        onClick={handleForcePay}
                        disabled={loadingPayment}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {loadingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BanknoteIcon className="w-4 h-4 mr-2" />}
                        Force Mark as Paid
                    </Button>
                )}
                {!isAttended && (
                    <Button
                        variant="default"
                        onClick={handleForceAttend}
                        disabled={loadingAttendance}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {loadingAttendance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquareIcon className="w-4 h-4 mr-2" />}
                        Force Check-In (Attendance)
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
