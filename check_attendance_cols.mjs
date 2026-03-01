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

async function checkAttendanceColumns() {
    console.log("Checking attendance table columns...");
    const { data, error } = await supabase.from('attendance').select('*').limit(1);

    if (error) {
        console.error("Error fetching attendance:", error);
    } else if (data && data.length > 0) {
        console.log("✅ Columns in attendance table:", Object.keys(data[0]));
    } else {
        console.log("Table is empty.");
        // Try selecting specific columns to see if they exist
        const testCols = ['check_in_time', 'scanned_by', 'session_name', 'is_retroactive'];
        for (const col of testCols) {
            const { error: colError } = await supabase.from('attendance').select(col).limit(1);
            if (colError) {
                console.log(`❌ Column '${col}' does NOT exist.`);
            } else {
                console.log(`✅ Column '${col}' exists.`);
            }
        }
    }
}

checkAttendanceColumns();
