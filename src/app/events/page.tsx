import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { CalendarIcon, MapPinIcon } from 'lucide-react'
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
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                <p className="text-xl text-muted-foreground">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
                <Card key={event.id} className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="h-48 overflow-hidden relative">
                        <img
                            src={event.banner_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                    <CardHeader>
                        <CardTitle className="line-clamp-2 text-xl">{event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            {new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </CardDescription>
                        <CardDescription className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-red-500" />
                            {event.location || 'TBA'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href={`/events/${event.id}`}>View Details</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
