import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventColumns() {
    console.log("Checking events table columns...");
    const { data, error } = await supabase.from('events').select('*').limit(1);

    if (error) {
        console.error("Error fetching events:", error);
    } else if (data && data.length > 0) {
        console.log("✅ Columns in events table:", Object.keys(data[0]));
    } else {
        console.log("Table is empty.");
        const testCols = ['date', 'end_date', 'title', 'attendance_sessions'];
        for (const col of testCols) {
            const { error: colError } = await supabase.from('events').select(col).limit(1);
            if (colError) {
                console.log(`❌ Column '${col}' does NOT exist.`);
            } else {
                console.log(`✅ Column '${col}' exists.`);
            }
        }
    }
}

checkEventColumns();
