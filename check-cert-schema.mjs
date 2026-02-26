import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .limit(1)

    if (error) {
        if (error.message.includes('relation "certificate_templates" does not exist')) {
            console.log("TABLE_MISSING")
        } else {
            console.log("ERROR", error)
        }
    } else {
        console.log("TABLE_EXISTS", data)
    }
}

check()
