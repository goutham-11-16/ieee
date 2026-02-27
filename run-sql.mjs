import { StorageClient } from '@supabase/storage-js'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { readFileSync } from 'fs'
import path from 'path'
import { Client } from 'pg'

async function run() {
    // Read from env var
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) throw new Error("Need SUPABASE_SERVICE_ROLE_KEY env var")

    const connectionString = `postgresql://postgres.nndvljffqixyokqfbbof:${key}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`

    const client = new Client({
        connectionString: connectionString
    })

    try {
        await client.connect()
        console.log("Connected to DB")

        const queryFile = process.argv[2]
        if (!queryFile) throw new Error("Need a file")

        const sql = readFileSync(queryFile, 'utf8')

        // Remove comments out of the raw query for pg client
        const cleanSql = sql.replace(/--.*$/gm, '').trim()

        console.log("Running SQL:", cleanSql)
        const result = await client.query(cleanSql)
        console.log("Success:", result)

    } catch (e) {
        console.error("Failed:", e)
    } finally {
        await client.end()
    }
}
run()
