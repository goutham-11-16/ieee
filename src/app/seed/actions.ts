'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTestUser(email: string, fullName: string, role: string) {
    const supabase = await createClient()

    // 1. Sign Up the user
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'TestPassword123!',
        options: {
            data: {
                full_name: fullName,
                // We'll trust the trigger to set default, then update via SQL because 
                // we can't force the role here safely without service_role key
            }
        }
    })

    if (error) {
        return { success: false, email, role, error: error.message }
    }

    if (data.user?.identities?.length === 0) {
        return { success: false, email, role, error: 'User already exists' }
    }

    return { success: true, email, role, userId: data.user?.id }
}
