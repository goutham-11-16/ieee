const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data, error } = await supabase
        .from('payments')
        .select(`
            id,
            amount,
            status,
            created_at,
            registration:registrations(guest_name, user:profiles!registrations_user_id_fkey(full_name, email), event:events(title))
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });
    console.log(JSON.stringify({ data, error }, null, 2));
})();
