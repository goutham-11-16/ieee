'use server'

import { createClient } from '@/lib/supabase/server'

export async function logAction(
    action: string,
    entityType: string,
    entityId: string,
    metadata?: any
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_values: metadata,
    })
}
