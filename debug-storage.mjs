import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugStorage() {
    console.log("=== Debugging Storage Buckets ===")
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
        console.log("Storage Error:", bucketsError)
        return
    }

    const bucketNames = buckets.map(b => b.name)
    console.log("Existing Buckets:", bucketNames)

    if (!bucketNames.includes('receipts')) {
        console.log("CRITICAL ERROR: 'receipts' bucket DOES NOT EXIST.")
    } else {
        console.log("'receipts' bucket exists. Testing permissions...")
        // Try to list files in receipts
        const { data, error } = await supabase.storage.from('receipts').list()
        console.log("Files in receipts list error:", error?.message || 'null')
    }
}

debugStorage()
