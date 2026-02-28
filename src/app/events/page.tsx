import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { CalendarIcon, MapPinIcon, ArrowRight, Ghost } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function EventsPage() {
    const supabase = await createClient()
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('date', { ascending: true })

    const now = new Date()
    const upcomingEvents = events?.filter(event => new Date(event.date) >= now) || []
    const pastEvents = events?.filter(event => new Date(event.date) < now).reverse() || [] // Most recent past first

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold tracking-tight mb-8 text-center">Event Center</h1>

            <Tabs defaultValue="upcoming" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                        <TabsTrigger value="past">Past Events</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="upcoming">
                    <EventGrid events={upcomingEvents} emptyMessage="No upcoming events scheduled." />
                </TabsContent>

                <TabsContent value="past">
                    <EventGrid events={pastEvents} emptyMessage="No past events found." />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function EventGrid({ events, emptyMessage }: { events: any[], emptyMessage: string }) {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed shadow-inner">
                <Ghost className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">It's quiet in here...</h3>
                <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
                const isPast = new Date(event.date) < new Date()
                const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                let badgeClass = ''
                let badgeText = ''

                if (isPast) {
                    badgeClass = 'bg-slate-100 text-slate-800 border-slate-200'
                    badgeText = 'Completed'
                } else if (daysUntil <= 3 && daysUntil >= 0) {
                    badgeClass = 'bg-red-100 text-red-800 border-red-200 animate-pulse'
                    badgeText = `Closes in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                } else {
                    badgeClass = 'bg-blue-100 text-blue-800 border-blue-200'
                    badgeText = 'Live'
                }

                return (
                    <Card key={event.id} className="flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group border-muted/60">
                        <div className="h-48 overflow-hidden relative">
                            <img loading="lazy"
                                src={event.banner_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-sm z-10">
                                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border shadow-sm backdrop-blur-sm z-10 ${badgeClass}`}>
                                {badgeText}
                            </div>
                        </div>
                        <CardHeader className="pb-3">
                            <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">{event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                                <CalendarIcon className="w-4 h-4 text-blue-500" />
                                {new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </CardDescription>
                            <CardDescription className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-red-500" />
                                {event.location || 'TBA'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow pb-4">
                            <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md" variant="secondary">
                                <Link href={`/events/${event.id}`}>
                                    View Details <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}
