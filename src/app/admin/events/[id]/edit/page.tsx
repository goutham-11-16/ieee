import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { DeleteEventButton } from '../delete-button'
import { EditEventForm } from './edit-event-form'

export default async function EditEventPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const profile = await getCurrentProfile()
    const allowedRoles = ['admin', 'super_admin', 'event_admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/')
    }

    const supabase = await createClient()
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!event) notFound()

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Edit Event: {event.title}</h1>
                {(profile.role === 'super_admin' || profile.role === 'admin') && (
                    <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                )}
            </div>

            {profile.role === 'event_admin' && (
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-md text-sm mb-6 border border-orange-200 dark:border-orange-800">
                    <strong>Note:</strong> As an Event Admin, any changes you make here will be submitted to the Super Admins for approval before they go live on the public site.
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Event Configuration</CardTitle>
                    <CardDescription>Update metadata, dates, and dynamic form configurations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditEventForm event={event} profileRole={profile.role} />
                </CardContent>
            </Card>
        </div>
    )
}
