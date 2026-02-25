const { Client } = require('pg')
const fs = require('fs')

async function run() {
    const connectionString = "postgresql://postgres.nndvljffqixyokqfbbof:[SUPABASE_SERVICE_ROLE_KEY]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

    const envFile = fs.readFileSync('.env.local', 'utf-8')
    let keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)
    const key = keyMatch[1].trim()
    const connStr = connectionString.replace('[SUPABASE_SERVICE_ROLE_KEY]', key)

    const client = new Client({ connectionString: connStr })

    try {
        await client.connect()
        console.log("Connected to DB")

        const queryFile = process.argv[2]
        if (!queryFile) throw new Error("Need a file")

        const sql = fs.readFileSync(queryFile, 'utf8')
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
