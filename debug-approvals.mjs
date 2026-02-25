import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log("Fetching approval requests...");
    const { data: requests, error: reqError } = await supabase
        .from('approval_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (reqError) {
        console.error("Error fetching requests:", reqError);
    } else {
        console.log("Last 10 approval requests:");
        console.table(requests);
    }

    console.log("Testing insert...");

    // Attempting to insert an approval request as if we were the server bypass
    const { data: insertData, error: insertError } = await supabase
        .from('approval_requests')
        .insert({
            requester_id: '1e5e54d1-be69-4e76-ae0e-26fbb14309ba', // dummy UUID, format only matters
            action_type: 'UPDATE_DATA',
            entity_table: 'events',
            entity_id: '2e5e54d1-be69-4e76-ae0e-26fbb14309bb',
            new_data: { test: true },
            status: 'pending'
        })
        .select()

    if (insertError) {
        console.error("Insert Error message:", insertError.message);
        console.error("Insert Error hint:", insertError.hint);
        console.error("Insert Error details:", insertError.details);
    } else {
        console.log("Insert Success:", insertData)
    }
}

checkDatabase();
