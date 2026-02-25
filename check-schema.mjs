import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mobmmukykkhatathjraj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vYm1tdWt5a2toYXRhdGhqcmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjgzNDQsImV4cCI6MjA4NzAwNDM0NH0.p3Yxw5Cmij7loMhaBcXPQ5Pbeb_euZGxQOk0u_kMQcA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    const { error } = await supabase.from('events').insert({
        title: "Title",
        description: "Desc",
        event_type: "Hackathon",
        date: new Date().toISOString(),
        location: "Loc",
        max_capacity: null,
        requires_approval: false,
        is_published: false,
        status: "draft",
        created_by: "00000000-0000-0000-0000-000000000000",
        registration_start: null,
        registration_end: null,
        payment_deadline: null,
        fees: 0,
        coordinators: [],
        is_team_event: false,
        min_team_size: 1,
        max_team_size: 1,
        disabled_default_fields: [],
        form_schema: [],
        team_member_settings: {}
    });
    console.log("Error:", error);
}

checkSchema();
