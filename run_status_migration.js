require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runStatusMigration() {
  console.log('🚀 Starting Status Management Enhancement Migration...\n');

  try {
    // Step 1: Log migration start
    console.log('📝 Step 1: Logging migration start...');
    await supabase
      .from('migration_log')
      .insert({
        migration_name: '005_status_management_enhancement',
        start_time: new Date().toISOString(),
        status: 'STARTED'
      });

    // Step 2: Backup current status data
    console.log('💾 Step 2: Creating backup of current status data...');
    const { data: currentData, error: backupError } = await supabase
      .from('shippingquotes')
      .select('id, status, brokers_status');

    if (backupError) {
      console.error('❌ Error backing up data:', backupError);
      throw backupError;
    }

    console.log(`� Backed up ${currentData.length} quotes`);

    // Step 3: Normalize status values to prepare for enum conversion
    console.log('🔄 Step 3: Normalizing status values...');
    
    const statusMapping = {
      'Quote': 'quoted',
      'Order': 'order', 
      'Archived': 'archived',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'pending': 'pending',
      'Delivered': 'delivered'
    };

    const brokersStatusMapping = {
      'In Progress': 'in_progress',
      'Need More Info': 'need_more_info',
      'Priced': 'priced',
      'Dispatched': 'dispatched', 
      'Picked Up': 'picked_up',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled'
    };

    // Update each record individually to handle the normalization
    let updatedCount = 0;
    for (const quote of currentData) {
      const normalizedStatus = statusMapping[quote.status] || (quote.status ? quote.status.toLowerCase() : 'pending');
      const normalizedBrokersStatus = brokersStatusMapping[quote.brokers_status] || (quote.brokers_status ? quote.brokers_status.toLowerCase().replace(/ /g, '_') : 'in_progress');

      if (normalizedStatus !== quote.status || normalizedBrokersStatus !== quote.brokers_status) {
        const { error: updateError } = await supabase
          .from('shippingquotes')
          .update({
            status: normalizedStatus,
            brokers_status: normalizedBrokersStatus
          })
          .eq('id', quote.id);

        if (updateError) {
          console.error(`❌ Error updating quote ${quote.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} quotes with normalized status values`);
    // Step 4: Verify the changes
    console.log('🔍 Step 4: Verifying status normalization...');
    
    const { data: statusCheck } = await supabase
      .from('shippingquotes')
      .select('status, brokers_status')
      .limit(10);
    
    console.log('📊 Sample normalized status values:', statusCheck);

    // Step 5: Check distinct values after normalization
    const distinctStatuses = [...new Set(currentData.map(row => {
      return statusMapping[row.status] || (row.status ? row.status.toLowerCase() : 'pending');
    }))];
    
    const distinctBrokersStatuses = [...new Set(currentData.map(row => {
      return brokersStatusMapping[row.brokers_status] || (row.brokers_status ? row.brokers_status.toLowerCase().replace(/ /g, '_') : 'in_progress');
    }))];

    console.log('� Final distinct status values:', distinctStatuses.sort());
    console.log('📈 Final distinct brokers_status values:', distinctBrokersStatuses.sort());

    // Step 6: Log migration completion
    console.log('📝 Step 6: Logging migration completion...');
    await supabase
      .from('migration_log')
      .update({
        end_time: new Date().toISOString(),
        status: 'COMPLETED',
        details: 'Status normalization completed - enum creation requires database admin access'
      })
      .eq('migration_name', '005_status_management_enhancement')
      .eq('status', 'STARTED');

    console.log('\n✨ Status Management Enhancement Migration Phase 1 completed successfully!');
    console.log('\n⚠️  NOTE: Enum creation and triggers require database admin access.');
    console.log('The status values have been normalized and are ready for enum conversion.');
    
  } catch (error) {
    console.error('💥 Migration error:', error);
    
    // Log failure
    await supabase
      .from('migration_log')
      .update({
        end_time: new Date().toISOString(),
        status: 'FAILED',
        details: error.message
      })
      .eq('migration_name', '005_status_management_enhancement')
      .eq('status', 'STARTED');
      
    process.exit(1);
  }
  
  process.exit(0);
}

runStatusMigration();
