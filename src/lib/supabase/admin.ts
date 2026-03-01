import { createClient } from '@supabase/supabase-js'

// This client bypasses Row Level Security and should ONLY be used in secure server components/actions.
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            "CRITICAL CONFIGURATION ERROR: Missing Vercel Environment Variables.\\n" +
            "Please ensure 'NEXT_PUBLIC_SUPABASE_URL' and 'SUPABASE_SERVICE_ROLE_KEY' are added to your Vercel project settings."
        )
    }

    return createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
