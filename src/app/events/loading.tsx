import { EventCardSkeleton } from "@/components/events/event-card-skeleton"

export default function Loading() {
    return (
        <div className="container py-10 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-2" />
                    <div className="h-5 w-96 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}
