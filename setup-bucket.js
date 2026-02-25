const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys", env);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
    console.log("Checking buckets...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("List Error:", listError);
        return;
    }

    console.log("Found buckets:", buckets.map(b => b.name));

    const exists = buckets?.some(b => b.name === 'event_assets');
    if (!exists) {
        console.log("Bucket not found, creating 'event_assets'...");
        const { data, error } = await supabase.storage.createBucket('event_assets', { public: true });
        if (error) console.error("Error creating bucket:", error);
        else console.log("Created successfully:", data);
    } else {
        console.log("Bucket already exists.");
    }
}

setupBucket()
