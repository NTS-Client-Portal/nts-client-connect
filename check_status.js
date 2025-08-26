require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusValues() {
  // Check distinct status values
  const { data: statusData, error: statusError } = await supabase
    .from('shippingquotes')
    .select('status')
    .not('status', 'is', null);

  if (statusError) {
    console.error('Error fetching status values:', statusError);
    return;
  }

  // Get distinct status values
  const distinctStatuses = [...new Set(statusData.map(row => row.status))];
  console.log('Current distinct status values:', distinctStatuses.sort());

  // Check distinct brokers_status values
  const { data: brokersStatusData, error: brokersStatusError } = await supabase
    .from('shippingquotes')
    .select('brokers_status')
    .not('brokers_status', 'is', null);

  if (brokersStatusError) {
    console.error('Error fetching brokers_status values:', brokersStatusError);
    return;
  }

  const distinctBrokersStatuses = [...new Set(brokersStatusData.map(row => row.brokers_status))];
  console.log('Current distinct brokers_status values:', distinctBrokersStatuses.sort());

  // Count total quotes
  const { count } = await supabase
    .from('shippingquotes')
    .select('*', { count: 'exact', head: true });

  console.log(`Total quotes in database: ${count}`);

  process.exit(0);
}

checkStatusValues().catch(console.error);
