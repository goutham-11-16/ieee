import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TemplateDesigner from './designer'

export default async function CertificateTemplatePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // Fetch Event
    const { data: event } = await supabase
        .from('events')
        .select('id, title')
        .eq('id', params.id)
        .single()

    if (!event) notFound()

    // Fetch existing template
    const { data: template } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', params.id)
        .single()

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-2">Certificate Designer</h1>
            <p className="text-muted-foreground mb-8">Event: {event.title}</p>

            <TemplateDesigner
                eventId={params.id}
                existingTemplate={template}
            />
        </div>
    )
}
