import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import CertificateDesigner from './designer'

export default async function CertificateTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const resolvedParams = await params

    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

    if (!event) redirect('/admin/certificates')

    const { data: template } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', resolvedParams.id)
        .single()

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/certificates"><ArrowLeftIcon className="w-5 h-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Template Designer: {event.title}</h1>
                    <p className="text-muted-foreground">Configure the automated certificate format for this event.</p>
                </div>
            </div>

            <CertificateDesigner eventId={event.id} existingTemplate={template} />
        </div>
    )
}
