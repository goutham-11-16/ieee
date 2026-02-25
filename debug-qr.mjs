import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data } = await supabase.from('events').select('id, title, payment_qr_url').order('created_at', { ascending: false }).limit(5)
    console.log(data)
}
check()
