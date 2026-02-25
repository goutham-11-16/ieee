import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"

export async function FeaturedEvents() {
    const supabase = await createClient()

    // Artificial delay to show skeleton (remove in production if not needed)
    // await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: featuredEvents } = await supabase
        .from('events')
        .select('id, title, date, location, banner_url')
        .eq('is_published', true)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3)

    if (!featuredEvents || featuredEvents.length === 0) {
        return null
    }

    return (
        <section className="py-20">
            <div className="container px-4">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold">Featured Events</h2>
                        <p className="text-muted-foreground mt-2">Don't miss out on our upcoming activities.</p>
                    </div>
                    <Button variant="link" asChild className="hidden md:inline-flex">
                        <Link href="/events">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {featuredEvents.map(event => (
                        <ScrollReveal key={event.id}>
                            <CardContainer className="inter-var">
                                <CardBody className="bg-white relative group/card dark:bg-slate-900 border-black/[0.1] w-full h-auto rounded-xl p-0 border overflow-hidden hover:shadow-2xl transition duration-500 dark:border-white/[0.1]">
                                    <CardItem translateZ="50" className="w-full relative h-48">
                                        <Link href={`/events/${event.id}`}>
                                            <img
                                                src={event.banner_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"}
                                                alt={event.title}
                                                className="h-full w-full object-cover rounded-t-xl"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/card:opacity-100 transition-opacity"></div>
                                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 px-3 py-1 rounded-md text-sm font-bold shadow-sm backdrop-blur-sm text-black dark:text-white">
                                                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        </Link>
                                    </CardItem>

                                    <div className="p-6">
                                        <CardItem translateZ="30" className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1 mb-2 group-hover/card:text-blue-600 transition-colors">
                                            {event.title}
                                        </CardItem>
                                        <CardItem as="p" translateZ="20" className="text-slate-500 text-sm max-w-sm mt-2 dark:text-slate-300 line-clamp-1 flex items-center gap-1 mb-6">
                                            {event.location || 'Location TBA'}
                                        </CardItem>

                                        <CardItem translateZ="40" className="w-full">
                                            <Button asChild className="w-full rounded-full group-hover/card:bg-blue-600 group-hover/card:text-white transition-colors" variant="secondary">
                                                <Link href={`/events/${event.id}`}>View Details</Link>
                                            </Button>
                                        </CardItem>
                                    </div>
                                </CardBody>
                            </CardContainer>
                        </ScrollReveal>
                    ))}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Button variant="outline" asChild>
                        <Link href="/events">View All Events</Link>
                    </Button>
                </div>
            </div >
        </section >
    )
}
