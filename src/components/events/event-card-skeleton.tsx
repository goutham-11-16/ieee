import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function EventCardSkeleton() {
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <div className="h-48 w-full bg-muted animate-pulse" />
            <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-16" />
            </CardFooter>
        </Card>
    )
}
