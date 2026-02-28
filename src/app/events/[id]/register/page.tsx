import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GuestRegistrationForm from '../guest-registration-form'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default async function RegisterPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!event) {
        notFound()
    }

    const now = new Date()
    const regStart = event.registration_start ? new Date(event.registration_start) : null
    const regEnd = event.registration_end ? new Date(event.registration_end) : new Date(event.date)

    const isBeforeReg = regStart ? now < regStart : false
    const isRegistrationClosed = now > regEnd

    if (isBeforeReg) {
        return (
            <div className="container mx-auto py-24 px-4 text-center">
                <h1 className="text-3xl font-bold text-amber-600 mb-4">Registration Not Yet Open</h1>
                <p className="text-muted-foreground mb-8">Registration for {event.title} will open on {regStart?.toLocaleString()}.</p>
                <Link href={`/events/${event.id}`} className="text-blue-600 hover:underline inline-flex items-center">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Event
                </Link>
            </div>
        )
    }

    if (isRegistrationClosed) {
        return (
            <div className="container mx-auto py-24 px-4 text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Registration Closed</h1>
                <p className="text-muted-foreground mb-8">Registration for {event.title} has officially closed.</p>
                <Link href={`/events/${event.id}`} className="text-blue-600 hover:underline inline-flex items-center">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Event
                </Link>
            </div>
        )
    }

    let takenSeats = 0
    if (event.max_capacity) {
        const { data: activeRegs } = await supabase
            .from('registrations')
            .select('team_members, status, expires_at')
            .eq('event_id', params.id)
            .neq('status', 'cancelled')

        if (activeRegs) {
            const nowTime = new Date().getTime()
            takenSeats = activeRegs.reduce((acc, reg) => {
                if (reg.status === 'pending_payment' && reg.expires_at) {
                    const expTime = new Date(reg.expires_at).getTime()
                    if (nowTime > expTime) return acc // Expired seat
                }
                const teamCount = Array.isArray(reg.team_members) ? reg.team_members.length : 0
                return acc + 1 + teamCount
            }, 0)
        }

        if (takenSeats >= event.max_capacity) {
            return (
                <div className="container mx-auto py-24 px-4 text-center">
                    <h1 className="text-3xl font-bold text-orange-600 mb-4">Event Sold Out</h1>
                    <p className="text-muted-foreground mb-8">All seats for {event.title} have been reserved. Waitlists are not currently available.</p>
                    <Link href={`/events/${event.id}`} className="text-blue-600 hover:underline inline-flex items-center">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Event
                    </Link>
                </div>
            )
        }
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <div className="mb-8">
                <Link href={`/events/${event.id}`} className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center text-sm mb-4">
                    <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Event Details
                </Link>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h1>
                    <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{event.location || 'Location TBA'}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">{event.fees > 0 ? `₹${event.fees.toFixed(2)}` : 'Free Event'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-xl border shadow-lg">
                <GuestRegistrationForm
                    eventId={event.id}
                    eventDate={event.date}
                    registrationEnd={event.registration_end}
                    disabledFields={event.disabled_default_fields}
                    formSchema={event.form_schema}
                    isTeamEvent={event.is_team_event}
                    minTeamSize={event.min_team_size}
                    maxTeamSize={event.max_team_size}
                    teamMemberSettings={event.team_member_settings}
                    baseFee={event.fees}
                    isFeePerPerson={event.is_fee_per_person}
                />
            </div>
        </div>
    )
}
