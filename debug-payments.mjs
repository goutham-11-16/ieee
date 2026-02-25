import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugPaymentsQuery() {
    console.log("=== Debugging Payments Query ===")
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
        id,
        amount,
        status,
        created_at,
        transaction_reference,
        registration:registrations (
            user:profiles!user_id(full_name, email),
            event:events(title)
        )
    `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: true })

    console.log("Payments Error:", paymentsError)
    console.log("Payments Count:", payments?.length || 0)
    console.log("Payments Data:", JSON.stringify(payments, null, 2))

    if (paymentsError && paymentsError.message.includes('foreign key')) {
        console.log("We have a join error in payments!")
    }

    // Double check if there's any payments at all
    const { data: allPayments } = await supabase.from('payments').select('*').limit(5)
    console.log("Total Random Payments in DB:", allPayments?.length || 0)
    console.log("Total Payments Data:", JSON.stringify(allPayments, null, 2))
}

debugPaymentsQuery()
