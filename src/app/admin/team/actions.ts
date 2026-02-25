'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/actions/audit'

export async function getTeamMembers() {
    const supabase = await createClient()
    const { data: members, error } = await supabase
        .from('team_profiles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        console.error("Error fetching team members:", error)
        return []
    }
    return members
}

export async function addTeamMember(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const bio = formData.get('bio') as string
    const display_order = parseInt(formData.get('display_order') as string) || 0
    const github_url = formData.get('github_url') as string
    const linkedin_url = formData.get('linkedin_url') as string
    const twitter_url = formData.get('twitter_url') as string
    const instagram_url = formData.get('instagram_url') as string
    const image_url = formData.get('image_url') as string // This will be pre-uploaded via client

    const { data, error } = await supabase
        .from('team_profiles')
        .insert({
            name,
            role,
            bio,
            display_order,
            github_url,
            linkedin_url,
            twitter_url,
            instagram_url,
            image_url
        })
        .select()
        .single()

    if (error) return { error: error.message }

    await logAction('ADD_TEAM_MEMBER', 'team_profiles', data.id, { name, role })

    revalidatePath('/admin/team')
    revalidatePath('/team')
    return { success: true }
}

export async function updateTeamMember(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const bio = formData.get('bio') as string
    const display_order = parseInt(formData.get('display_order') as string) || 0
    const github_url = formData.get('github_url') as string
    const linkedin_url = formData.get('linkedin_url') as string
    const twitter_url = formData.get('twitter_url') as string
    const instagram_url = formData.get('instagram_url') as string
    const image_url = formData.get('image_url') as string

    const updates: any = {
        name,
        role,
        bio,
        display_order,
        github_url,
        linkedin_url,
        twitter_url,
        instagram_url,
        updated_at: new Date().toISOString()
    }

    if (image_url !== null) {
        updates.image_url = image_url
    }

    const { error } = await supabase
        .from('team_profiles')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }

    await logAction('UPDATE_TEAM_MEMBER', 'team_profiles', id, { name, role })

    revalidatePath('/admin/team')
    revalidatePath('/team')
    return { success: true }
}

export async function deleteTeamMember(id: string, imageUrl: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // First delete the image from storage if it exists
    if (imageUrl) {
        // Extract filename from URL (e.g., https://.../team_images/uuid.webp -> uuid.webp)
        const parts = imageUrl.split('/')
        const fileName = parts[parts.length - 1]
        if (fileName) {
            await supabase.storage.from('team_images').remove([fileName])
        }
    }

    // Then delete the DB record
    const { error } = await supabase
        .from('team_profiles')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    await logAction('DELETE_TEAM_MEMBER', 'team_profiles', id, { deleted: true })

    revalidatePath('/admin/team')
    revalidatePath('/team')
    return { success: true }
}
