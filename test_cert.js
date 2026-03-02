
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing Certificate Query...');

    // 1. Get a sample event ID
    const { data: events } = await supabase.from('events').select('id, title').limit(5);
    if (!events || events.length === 0) {
        console.log('No events found');
        return;
    }

    const eventId = events[0].id; // We'll try a few events if needed
    console.log(`Using Event: ${events[0].title} (${eventId})`);

    // 2. Run the query from the API route
    console.log('\n--- Query 1: registration:registrations!inner(event_id) ---');
    const { data: certs1, error: error1 } = await supabase.from('certificates')
        .select('unique_code, participant_name, created_at, registration:registrations!inner(event_id)')
        .eq('registration.event_id', eventId);

    if (error1) {
        console.error('Query1 Error:', error1);
    } else {
        console.log(`Found ${certs1?.length || 0} certificates`);
        if (certs1 && certs1.length > 0) {
            console.log('Sample:', certs1[0]);
        }
    }

    // 3. Try alternative query syntax
    console.log('\n--- Query 2: registrations!inner(event_id) ---');
    const { data: certs2, error: error2 } = await supabase.from('certificates')
        .select('unique_code, participant_name, created_at, registrations!inner(event_id)')
        .eq('registrations.event_id', eventId);

    if (error2) {
        console.error('Query2 Error:', error2);
    } else {
        console.log(`Found ${certs2?.length || 0} certificates`);
        if (certs2 && certs2.length > 0) {
            console.log('Sample:', certs2[0]);
        }
    }

    // 4. Try filtering by field directly if it exists (Unlikely)
    console.log('\n--- Query 3: Manual join check ---');
    const { data: allCerts } = await supabase.from('certificates').select('registration_id').limit(10);
    if (allCerts && allCerts.length > 0) {
        const regIds = allCerts.map(c => c.registration_id);
        const { data: regs } = await supabase.from('registrations').select('id, event_id').in('id', regIds);
        console.log('Sample Regs for existing certs:', regs);
    }
}

testQuery();
