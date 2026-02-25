import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testQuery() {
    console.log("Testing Registrations fetch (Anon)...")
    const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('id, reference_number, status')
        .limit(5)
    console.log("Error:", regError)
    console.log("Data:", regData)

    console.log("Testing Events fetch (Anon)...")
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, status')
        .limit(5)
    console.log("Error:", eventError)
    console.log("Data:", eventData)
}

testQuery()
