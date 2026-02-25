const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
// We will test with the ANON key and a valid user JWT if possible, but actually let's use the SERVICE ROLE 
// and see if the UPDATE fails because of invalid columns!
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testApprove() {
    const { data: event, error: fetchErr } = await supabase.from('events').select('*').limit(1).single()
    if (!event) return console.log("No events", fetchErr)

    // Simulate what the Event Admin provides
    const newData = {
        title: event.title + " (Edited)",
        description: event.description,
        event_type: event.event_type,
        date: event.date || null,
        location: event.location,
        max_capacity: event.max_capacity,
        requires_approval: event.requires_approval,
        registration_start: event.registration_start,
        registration_end: event.registration_end,
        payment_deadline: event.payment_deadline,
        fees: event.fees,
        coordinators: event.coordinators,
        is_team_event: event.is_team_event,
        min_team_size: event.min_team_size,
        max_team_size: event.max_team_size,
        disabled_default_fields: event.disabled_default_fields,
        form_schema: event.form_schema,
        team_member_settings: event.team_member_settings,
        attendance_sessions: event.attendance_sessions,
        payment_qr_url: event.payment_qr_url,
        updated_at: new Date().toISOString()
    }

    const { error: srError } = await supabase.from('events').update(newData).eq('id', event.id)
    if (srError) {
        console.log("Update Error:", JSON.stringify(srError, null, 2))
    } else {
        console.log("Update Success.")
    }
}

testApprove()
