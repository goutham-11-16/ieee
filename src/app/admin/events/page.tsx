import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { DeleteEventButton } from './[id]/delete-button'

export default async function AdminEventsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })

    // Fetch pending virtual drafts for this user
    let pendingDrafts: any[] = []
    if (user) {
        const { data: drafts } = await supabase
            .from('approval_requests')
            .select('*')
            .eq('action_type', 'PUBLISH_EVENT')
            .eq('entity_table', 'events')
            .eq('entity_id', '00000000-0000-0000-0000-000000000000') // our Virtual Draft identifier
            .eq('status', 'pending')
            .eq('requester_id', user.id)

        if (drafts) pendingDrafts = drafts
    }

    const allItems = [
        ...(events || []),
        ...pendingDrafts.map(d => ({
            ...d.new_data, // Pull out the event properties
            id: d.id, // we use the request id as the card id, though it shouldn't be clicked
            isVirtualDraft: true,
            status: d.status
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                <Button asChild>
                    <Link href="/admin/events/new">Create Event</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allItems?.map((event) => (
                    <Card key={event.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {new Date(event.date).toLocaleDateString()}
                            </CardTitle>
                            {event.isVirtualDraft ? (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none">Pending Approval</Badge>
                            ) : event.is_published ? (
                                <Badge variant="default">Published</Badge>
                            ) : (
                                <Badge variant="secondary">Draft</Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">{event.title}</div>
                            <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                            <div className="mt-4 flex gap-2">
                                {!event.isVirtualDraft && (
                                    <>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                                        </Button>
                                        <Button variant="secondary" size="sm" asChild>
                                            <Link href={`/events/${event.id}`}>View</Link>
                                        </Button>
                                        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                                    </>
                                )}
                                {event.isVirtualDraft && (
                                    <Button variant="outline" size="sm" disabled>
                                        Locked (Awaiting Super Admin)
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {(!allItems || allItems.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No events found. Create your first one!</p>
                )}
            </div>
        </div>
    )
}
