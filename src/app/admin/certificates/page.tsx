import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { FileBadge2 } from 'lucide-react'

export default async function CertificatesPage() {
    const supabase = await createClient()

    // Fetch all events that could have certificates
    const { data: events } = await supabase
        .from('events')
        .select(`
            id, 
            title, 
            date,
            is_published,
            templates:certificate_templates(id, is_locked)
        `)
        .order('date', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Certificate Templates</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events?.map((event: any) => {
                    const template = event.templates && event.templates.length > 0 ? event.templates[0] : null
                    const hasTemplate = !!template
                    const isLocked = template?.is_locked

                    return (
                        <Card key={event.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                                <CardDescription>{new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${hasTemplate ? (isLocked ? 'bg-emerald-500' : 'bg-yellow-500') : 'bg-slate-300'}`}></div>
                                    <span className="text-sm text-muted-foreground">
                                        {!hasTemplate && "No Template"}
                                        {hasTemplate && !isLocked && "Draft Template"}
                                        {hasTemplate && isLocked && "Active & Locked"}
                                    </span>
                                </div>
                                <Button asChild variant={hasTemplate ? "outline" : "default"} className="w-full">
                                    <Link href={`/admin/certificates/${event.id}`}>
                                        <FileBadge2 className="w-4 h-4 mr-2" />
                                        {hasTemplate ? "Manage Template" : "Create Template"}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}

                {(!events || events.length === 0) && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        No events found to attach certificates to.
                    </div>
                )}
            </div>
        </div>
    )
}
