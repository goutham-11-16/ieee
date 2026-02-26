'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentProfile } from '@/lib/auth'

export async function saveTemplate(eventId: string, backgroundUrl: string, layoutConfig: any[]) {
    const profile = await getCurrentProfile()
    if (!profile || !['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // check if it exists
    const { data: existing } = await supabase
        .from('certificate_templates')
        .select('id, is_locked')
        .eq('event_id', eventId)
        .single()

    if (existing?.is_locked) {
        return { success: false, error: 'Template is locked and cannot be edited.' }
    }

    if (existing) {
        const { error } = await supabase
            .from('certificate_templates')
            .update({
                background_url: backgroundUrl,
                layout_config: layoutConfig,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

        if (error) return { success: false, error: error.message }
    } else {
        const { error } = await supabase
            .from('certificate_templates')
            .insert({
                event_id: eventId,
                background_url: backgroundUrl,
                layout_config: layoutConfig
            })

        if (error) return { success: false, error: error.message }
    }

    revalidatePath(`/admin/certificates/${eventId}`)
    revalidatePath(`/admin/certificates`)
    return { success: true }
}

export async function requestTemplateLock(eventId: string) {
    const profile = await getCurrentProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()

    // Only Super Admins, Admins, and Content Admins can lock instantly.
    // For simplicity based on DB constraints, we'll lock it immediately for them or create an approval_request for others (like event_admin).
    if (['super_admin', 'admin', 'content_admin'].includes(profile.role)) {
        const { error } = await supabase
            .from('certificate_templates')
            .update({ is_locked: true, updated_at: new Date().toISOString() })
            .eq('event_id', eventId)

        if (error) return { success: false, error: error.message }
    } else {
        // Create an Approval Request for the Super Admin
        const { error } = await supabase
            .from('approval_requests')
            .insert({
                requester_id: profile.id,
                action_type: 'LOCK_TEMPLATE',
                entity_table: 'certificate_templates',
                entity_id: eventId, // Can use event_id temporarily for mapping
                new_data: { event_id: eventId }
            })

        if (error) return { success: false, error: 'Could not create lock request: ' + error.message }
    }

    revalidatePath(`/admin/certificates/${eventId}`)
    return { success: true }
}
