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
        <section className="py-16">
            <div className="container px-4">
                <div className="flex justify-between items-end mb-6 md:mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold">Featured Events</h2>
                        <p className="text-sm md:text-base text-muted-foreground mt-2">Don't miss out on our upcoming activities.</p>
                    </div>
                    <Button variant="link" asChild className="hidden md:inline-flex">
                        <Link href="/events">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {featuredEvents.map((event) => {
                        const isPast = new Date(event.date) < new Date()
                        const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                        let badgeClass = ''
                        let badgeText = ''

                        if (isPast) {
                            badgeClass = 'bg-slate-100 text-slate-800'
                            badgeText = 'Completed'
                        } else if (daysUntil <= 3 && daysUntil >= 0) {
                            badgeClass = 'bg-red-100 text-red-800 animate-pulse'
                            badgeText = `Closes in ${daysUntil}d`
                        } else {
                            badgeClass = 'bg-blue-100 text-blue-800'
                            badgeText = 'Live'
                        }

                        return (
                            <ScrollReveal key={event.id}>
                                <CardContainer className="inter-var">
                                    <CardBody className="bg-white relative group/card dark:bg-slate-900 border-black/[0.1] w-full h-auto rounded-xl p-0 border overflow-hidden hover:shadow-2xl transition duration-500 dark:border-white/[0.1] hover:-translate-y-1">
                                        <CardItem translateZ="50" className="w-full relative h-48">
                                            <Link href={`/events/${event.id}`}>
                                                <img
                                                    src={event.banner_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover rounded-t-xl"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/card:opacity-100 transition-opacity"></div>
                                                <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-sm text-black dark:text-white">
                                                    {new Date(event.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm ${badgeClass}`}>
                                                    {badgeText}
                                                </div>
                                            </Link>
                                        </CardItem>

                                        <div className="p-5">
                                            <CardItem translateZ="30" className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1 mb-2 group-hover/card:text-blue-600 transition-colors">
                                                {event.title}
                                            </CardItem>
                                            <CardItem as="p" translateZ="20" className="text-slate-500 text-sm max-w-sm mt-2 dark:text-slate-300 line-clamp-1 flex items-center gap-1 mb-4">
                                                {event.location || 'Location TBA'}
                                            </CardItem>

                                            <CardItem translateZ="40" className="w-full mt-2">
                                                <Button asChild className="w-full rounded-full group-hover/card:bg-primary group-hover/card:text-primary-foreground group-hover/card:shadow-md transition-all duration-300" variant="secondary">
                                                    <Link href={`/events/${event.id}`}>
                                                        View Details <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-300 delay-100" />
                                                    </Link>
                                                </Button>
                                            </CardItem>
                                        </div>
                                    </CardBody>
                                </CardContainer>
                            </ScrollReveal>
                        )
                    })}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/events">View All Events</Link>
                    </Button>
                </div>
            </div >
        </section >
    )
}
