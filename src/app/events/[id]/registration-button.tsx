'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { registerForEvent } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function RegistrationButton({
    eventId,
    isLoggedIn,
    registration,
    eventDate,
    registrationEnd
}: {
    eventId: string
    isLoggedIn: boolean
    registration: any
    eventDate: string
    registrationEnd: string | null
}) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const now = new Date()
    const isRegistrationClosed = registrationEnd ? new Date(registrationEnd) < now : new Date(eventDate) < now

    const handleRegister = async () => {
        if (!isLoggedIn) {
            router.push(`/login?next=/events/${eventId}`)
            return
        }

        setLoading(true)
        try {
            const result = await registerForEvent(eventId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.status === 'approved' ? 'Successfully registered!' : 'Registration pending approval.')
                router.refresh()
            }
        } catch (e) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (registration) {
        return (
            <div className="flex flex-col gap-2 relative">
                <Button disabled={registration.status !== 'approved'} variant={registration.status === 'approved' ? "outline" : "secondary"} asChild={registration.status === 'approved'}>
                    {registration.status === 'approved' ? (
                        <a href="/dashboard">View Dashboard / Ticket</a>
                    ) : (
                        <span>
                            {registration.status === 'pending_approval' ? 'Pending Approval' :
                                registration.status === 'rejected' ? 'Registration Rejected' :
                                    registration.status === 'expired' ? 'Registration Expired' : 'Cancelled'}
                        </span>
                    )}
                </Button>
                <div className="text-xs text-center text-muted-foreground">
                    <a href="/dashboard" className="hover:underline">Go to Dashboard</a>
                </div>
            </div>
        )
    }

    if (isRegistrationClosed) {
        return (
            <Button disabled variant="destructive">
                Registration Closed
            </Button>
        )
    }

    return (
        <Button onClick={handleRegister} disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Now
        </Button>
    )
}
