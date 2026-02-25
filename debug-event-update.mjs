import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// USE SERVICE ROLE to bypass RLS for setup, but wait, the bug happens when the Super Admin calls it.
// Super Admin uses their session. We will use SERVICE ROLE to check what happens.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testApprove() {
    // 1. Find an event
    const { data: event } = await supabase.from('events').select('*').limit(1).single()
    if (!event) return console.log("No events")

    console.log("Found event:", event.id)

    // 2. Perform the exact update that approveRequest does
    const newData = {
        title: event.title + " (Edited)",
        description: event.description,
        payment_qr_url: null,
        // ... all fields
    }

    // Try update with Service Role (should succeed)
    const { error: srError } = await supabase.from('events').update(newData).eq('id', event.id)
    console.log("Service Role Update Error:", srError)
}

testApprove()
