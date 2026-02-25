import { StorageClient } from '@supabase/storage-js'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { readFileSync } from 'fs'
import path from 'path'
import { Client } from 'pg' // use raw pg client

async function run() {
    const connectionString = "postgresql://postgres.nndvljffqixyokqfbbof:[SUPABASE_SERVICE_ROLE_KEY]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

    // We have the key in .env.local, let's load it
    const envFile = readFileSync('.env.local', 'utf-8')
    let keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)
    const key = keyMatch[1].trim()
    const connStr = connectionString.replace('[SUPABASE_SERVICE_ROLE_KEY]', key)

    const client = new Client({
        connectionString: connStr
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
