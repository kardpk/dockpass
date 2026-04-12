const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/farabibinimran/dockpass/apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    // try to get 1 boat
    const { data: boats, error } = await supabase.from('boats').select('*').limit(1);
    console.log(boats ? Object.keys(boats[0] || {}) : error);

    // try to get 1 trip
    const { data: trips, error: tErr } = await supabase.from('trips').select('*').limit(1);
    console.log(trips ? Object.keys(trips[0] || {}) : tErr);
}
main();
