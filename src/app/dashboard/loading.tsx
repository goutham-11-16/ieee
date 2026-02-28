import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

            <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-64" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 pl-0 md:pl-6 border-slate-100 dark:border-slate-800">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 flex-wrap">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-32" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
