import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalendarIcon, MapPinIcon, ClockIcon, TimerIcon, CreditCardIcon } from 'lucide-react'

export default async function EventDetailsPage(props: { params: Promise<{ id: string }> }) {
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
    const regEnd = event.registration_end ? new Date(event.registration_end) : new Date(event.date)
    const isClosingSoon = regEnd > now && (regEnd.getTime() - now.getTime()) < 24 * 60 * 60 * 1000 // 24 hours

    let takenSeats = 0
    if (event.max_capacity) {
        const { data: activeRegs } = await supabase
            .from('registrations')
            .select('team_members, status, expires_at')
            .eq('event_id', params.id)
            .neq('status', 'cancelled')

        if (activeRegs) {
            const nowTime = now.getTime()
            takenSeats = activeRegs.reduce((acc, reg) => {
                if (reg.status === 'pending_payment' && reg.expires_at) {
                    const expTime = new Date(reg.expires_at).getTime()
                    if (nowTime > expTime) return acc // Expired seat
                }
                const teamCount = Array.isArray(reg.team_members) ? reg.team_members.length : 0
                return acc + 1 + teamCount
            }, 0)
        }
    }
    const isSoldOut = event.max_capacity ? takenSeats >= event.max_capacity : false;
    const remainingSeats = event.max_capacity ? Math.max(0, event.max_capacity - takenSeats) : null;

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                {isClosingSoon && (
                    <div className="bg-orange-500 text-white text-center py-2 font-bold animate-pulse absolute top-0 w-full z-10 opacity-90 shadow-md">
                        ⚠️ Registration Closes in Less Than 24 Hours!
                    </div>
                )}
                {event.banner_url && (
                    <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-80 object-cover"
                    />
                )}
                <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b pb-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/40 dark:text-blue-200">
                                    {event.event_type}
                                </span>
                                {event.fees > 0 ? (
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full dark:bg-emerald-900/40 dark:text-emerald-200">
                                        ₹{event.fees.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full dark:bg-emerald-900/40 dark:text-emerald-200">
                                        Free
                                    </span>
                                )}
                                {isClosingSoon && (
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 rounded-full border border-orange-200 dark:border-orange-800/50 dark:bg-orange-900/40 dark:text-orange-200">
                                        Closing Soon
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">{event.title}</h1>
                        </div>
                        <div className="shrink-0 w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                            {isSoldOut ? (
                                <Button disabled variant="destructive" className="w-full md:w-auto px-8">
                                    Sold Out
                                </Button>
                            ) : !isClosingSoon && regEnd < now ? (
                                <Button disabled variant="destructive" className="w-full md:w-auto px-8">
                                    Registration Closed
                                </Button>
                            ) : (
                                <Button asChild size="lg" className="w-full md:w-auto px-8">
                                    <Link href={`/events/${event.id}/register`}>Register Now</Link>
                                </Button>
                            )}

                            {event.max_capacity && !isSoldOut && regEnd >= now && (
                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                    {remainingSeats === 1 ? 'Only 1 seat remaining!' : `Only ${remainingSeats} seats remaining!`}
                                </p>
                            )}
                            {isSoldOut && (
                                <p className="text-sm font-semibold text-slate-500">
                                    Capacity of {event.max_capacity} reached
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Event Date</p>
                                    <p className="font-medium text-slate-900 dark:text-slate-200">
                                        {new Date(event.date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                                    <MapPinIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                    <p className="font-medium text-slate-900 dark:text-slate-200">{event.location || 'Location TBA'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                                    <ClockIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Registration Opens</p>
                                    <p className="font-medium text-slate-900 dark:text-slate-200">
                                        {event.registration_start ? new Date(event.registration_start).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Now'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
                                    <TimerIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Registration Closes</p>
                                    <p className={`font-medium ${isClosingSoon ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-900 dark:text-slate-200'}`}>
                                        {event.registration_end ? new Date(event.registration_end).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Before Event starts'}
                                    </p>
                                </div>
                            </div>
                            {event.payment_deadline && (
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                                        <CreditCardIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Payment Deadline</p>
                                        <p className="font-bold text-amber-700 dark:text-amber-500">
                                            {new Date(event.payment_deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none mb-8">
                        <h3 className="text-2xl font-semibold mb-4">About this Event</h3>
                        <p className="whitespace-pre-wrap">{event.description}</p>
                    </div>

                    {event.coordinators && event.coordinators.length > 0 && (
                        <div className="border-t pt-6">
                            <h3 className="text-xl font-semibold mb-4">Event Coordinators</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {event.coordinators.map((coordinator: any, index: number) => (
                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {coordinator.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium">{coordinator.name}</p>
                                            <p className="text-sm text-gray-500">{coordinator.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
