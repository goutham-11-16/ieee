import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugQueries() {
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
    console.log("Payments count:", payments?.length || 0)

    if (paymentsError && paymentsError.message.includes('foreign key')) {
        console.log("We have a join error in payments!")
    }

    console.log("\n=== Debugging Status Query (Looking for a registration) ===")
    const { data: randReg } = await supabase.from('registrations').select('reference_number, id').limit(1)

    if (randReg && randReg.length > 0) {
        const rawRef = randReg[0].reference_number
        console.log(`Using Registration Ref: ${rawRef}`)
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select(`
            id,
            status,
            created_at,
            reference_number,
            guest_name,
            guest_email,
            ticket_qr_uuid,
            custom_responses,
            team_members,
            event:events (
                id,
                title,
                date,
                location,
                registration_end,
                payment_deadline,
                fees
            ),
            payments (
                status,
                receipt_url
            ),
            attendance (
                check_in_time,
                check_out_time
            ),
            user:profiles!user_id(full_name, email)
        `)
            .eq('reference_number', rawRef)
            .single()

        console.log("Status Fetch Error:", regError)
        console.log("Status Found:", registration ? "YES" : "NO")
    } else {
        console.log("No registrations found at all in DB.")
    }
}

debugQueries()
