require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRedundancyCleanup() {
  console.log('🚀 Starting Data Redundancy Cleanup Migration...\n');

  try {
    // Step 1: Log migration start
    console.log('📝 Step 1: Starting migration...');
    await supabase
      .from('migration_log')
      .insert({
        migration_name: '006_data_redundancy_cleanup',
        start_time: new Date().toISOString(),
        status: 'STARTED'
      });

    // Step 2: Create backup data via client
    console.log('💾 Step 2: Creating data backup...');
    
    // Get current companies data
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      throw new Error(`Error backing up companies: ${companiesError.message}`);
    }

    // Get current profiles data  
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      throw new Error(`Error backing up profiles: ${profilesError.message}`);
    }

    // Write backups to file
    fs.writeFileSync('./companies_backup_006.json', JSON.stringify(companiesData, null, 2));
    fs.writeFileSync('./profiles_backup_006.json', JSON.stringify(profilesData, null, 2));

    console.log(`   ✅ Backed up ${companiesData.length} companies and ${profilesData.length} profiles`);

    // Step 3: Analyze current redundancy
    console.log('🔍 Step 3: Analyzing data redundancy...');
    
    let companiesRedundant = 0;
    let companiesMismatched = 0;
    let profilesRedundant = 0;
    let profilesMismatched = 0;

    // Analyze companies
    companiesData.forEach(company => {
      if (company.company_name) {
        if (company.name === company.company_name) {
          companiesRedundant++;
        } else {
          companiesMismatched++;
          console.log(`   ⚠️  Company mismatch: "${company.name}" vs "${company.company_name}"`);
        }
      }
    });

    // Analyze profiles (need to check against actual company names)
    for (const profile of profilesData) {
      if (profile.company_name && profile.company_id) {
        const company = companiesData.find(c => c.id === profile.company_id);
        if (company) {
          if (company.name === profile.company_name) {
            profilesRedundant++;
          } else {
            profilesMismatched++;
            console.log(`   ⚠️  Profile mismatch: "${profile.company_name}" vs "${company.name}"`);
          }
        }
      }
    }

    console.log(`   📊 Companies - Redundant: ${companiesRedundant}, Mismatched: ${companiesMismatched}`);
    console.log(`   👥 Profiles - Redundant: ${profilesRedundant}, Mismatched: ${profilesMismatched}`);

    // Step 4: Clean up redundant data (phase 1 - only perfect matches)
    console.log('🧹 Step 4: Cleaning up redundant data...');

    let companiesUpdated = 0;
    let profilesUpdated = 0;

    // Clean companies where company_name exactly matches name
    for (const company of companiesData) {
      if (company.company_name && company.name === company.company_name) {
        const { error } = await supabase
          .from('companies')
          .update({ company_name: null })
          .eq('id', company.id);

        if (error) {
          console.error(`   ❌ Error updating company ${company.id}:`, error.message);
        } else {
          companiesUpdated++;
        }
      }
    }

    // Clean profiles where company_name matches companies.name
    for (const profile of profilesData) {
      if (profile.company_name && profile.company_id) {
        const company = companiesData.find(c => c.id === profile.company_id);
        if (company && company.name === profile.company_name) {
          const { error } = await supabase
            .from('profiles')
            .update({ company_name: null })
            .eq('id', profile.id);

          if (error) {
            console.error(`   ❌ Error updating profile ${profile.id}:`, error.message);
          } else {
            profilesUpdated++;
          }
        }
      }
    }

    console.log(`   ✅ Updated ${companiesUpdated} companies and ${profilesUpdated} profiles`);

    // Step 5: Verification
    console.log('🔍 Step 5: Verifying cleanup...');
    
    const { data: updatedCompanies } = await supabase
      .from('companies')
      .select('id, name, company_name')
      .not('company_name', 'is', null);

    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('id, company_name, company_id')
      .not('company_name', 'is', null);

    console.log(`   📊 Remaining company_name entries: ${updatedCompanies?.length || 0} companies, ${updatedProfiles?.length || 0} profiles`);

    if (updatedCompanies?.length > 0) {
      console.log('   ⚠️  Remaining company mismatches (need manual review):');
      updatedCompanies.forEach(company => {
        console.log(`      - ID: ${company.id}, Name: "${company.name}", Company Name: "${company.company_name}"`);
      });
    }

    // Step 6: Log completion
    console.log('📝 Step 6: Logging completion...');
    await supabase
      .from('migration_log')
      .update({
        end_time: new Date().toISOString(),
        status: 'COMPLETED',
        details: `Phase 1 completed - cleaned ${companiesUpdated} companies and ${profilesUpdated} profiles. ${(updatedCompanies?.length || 0) + (updatedProfiles?.length || 0)} entries need manual review.`
      })
      .eq('migration_name', '006_data_redundancy_cleanup')
      .eq('status', 'STARTED');

    console.log('\n✨ Data Redundancy Cleanup Phase 1 completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Backed up ${companiesData.length} companies and ${profilesData.length} profiles`);
    console.log(`   • Cleaned up ${companiesUpdated} redundant companies entries`);
    console.log(`   • Cleaned up ${profilesUpdated} redundant profiles entries`);
    console.log(`   • ${(updatedCompanies?.length || 0)} companies still have mismatched names (manual review needed)`);
    console.log(`   • ${(updatedProfiles?.length || 0)} profiles still have mismatched names (manual review needed)`);
    
    if ((updatedCompanies?.length || 0) > 0 || (updatedProfiles?.length || 0) > 0) {
      console.log('\n⚠️  Next steps:');
      console.log('   1. Review remaining mismatches logged above');
      console.log('   2. Update application code to use canonical company names');
      console.log('   3. Run phase 2 to drop redundant columns');
    }
    
  } catch (error) {
    console.error('💥 Migration error:', error);
    
    // Log failure
    try {
      await supabase
        .from('migration_log')
        .update({
          end_time: new Date().toISOString(),
          status: 'FAILED',
          details: error.message
        })
        .eq('migration_name', '006_data_redundancy_cleanup')
        .eq('status', 'STARTED');
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
      
    process.exit(1);
  }
  
  process.exit(0);
}

runRedundancyCleanup();
