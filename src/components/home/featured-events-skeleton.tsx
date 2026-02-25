import { EventCardSkeleton } from "@/components/events/event-card-skeleton"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function FeaturedEventsSkeleton() {
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
                    {Array.from({ length: 3 }).map((_, i) => (
                        <EventCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </section>
    )
}
