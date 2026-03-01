import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DownloadIcon, BarChartIcon } from 'lucide-react'

export default async function AdminReportsPage() {
    const supabase = await createClient()

    // Assuming we want an overview across all events, or a selector. 
    // Let's provide a list of events to run reports on.
    const { data: events } = await supabase
        .from('events')
        .select('id, title, date, status')
        .order('date', { ascending: false })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Reports & Generation</h1>
            <p className="text-muted-foreground">Download comprehensive PDF reports for offline archiving.</p>

            <div className="grid grid-cols-1 gap-6">
                {events?.map(event => (
                    <Card key={event.id}>
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>{event.title} <span className="text-sm font-normal text-muted-foreground">({new Date(event.date).toLocaleDateString('en-GB')})</span></span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Button variant="outline" asChild className="w-full justify-start h-12">
                                    <a href={`/api/export/reports?eventId=${event.id}&type=registrations`} target="_blank">
                                        <DownloadIcon className="mr-2 h-4 w-4" /> Registrations
                                    </a>
                                </Button>
                                <Button variant="outline" asChild className="w-full justify-start h-12">
                                    <a href={`/api/export/reports?eventId=${event.id}&type=payments`} target="_blank">
                                        <DownloadIcon className="mr-2 h-4 w-4" /> Payments
                                    </a>
                                </Button>
                                <Button variant="outline" asChild className="w-full justify-start h-12">
                                    <a href={`/api/export/reports?eventId=${event.id}&type=attendance`} target="_blank">
                                        <DownloadIcon className="mr-2 h-4 w-4" /> Attendance List
                                    </a>
                                </Button>
                                <Button variant="default" asChild className="w-full justify-start h-12">
                                    <a href={`/api/export/reports?eventId=${event.id}&type=certificates`} target="_blank">
                                        <DownloadIcon className="mr-2 h-4 w-4" /> Certificate List
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {(!events || events.length === 0) && <p>No events found.</p>}
        </div>
    )
}
