import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentProfile } from '@/lib/auth'
import { CreateEventForm } from './create-event-form'

export default async function CreateEventPage() {
    const profile = await getCurrentProfile()
    const canPublishDirectly = profile?.role === 'super_admin' || profile?.role === 'admin'

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <CreateEventForm canPublishDirectly={canPublishDirectly} />
                </CardContent>
            </Card>
        </div>
    )
}
