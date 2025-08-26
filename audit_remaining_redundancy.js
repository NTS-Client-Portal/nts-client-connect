const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', supabaseKey);

async function auditRemainingRedundancy() {
    console.log('\n=== AUDIT: Remaining Redundant company_name Fields ===\n');

    // Check companies with redundant company_name
    console.log('1. Checking companies table for remaining company_name fields...');
    const { data: companiesWithRedundantNames, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, company_name')
        .not('company_name', 'is', null);

    if (companiesError) {
        console.error('Error checking companies:', companiesError.message);
    } else {
        console.log(`Found ${companiesWithRedundantNames?.length || 0} companies with redundant company_name field:`);
        if (companiesWithRedundantNames?.length > 0) {
            companiesWithRedundantNames.forEach((company, index) => {
                const nameMatch = company.name === company.company_name;
                console.log(`  ${index + 1}. ID: ${company.id}`);
                console.log(`     Canonical name: "${company.name}"`);
                console.log(`     Redundant company_name: "${company.company_name}"`);
                console.log(`     Names match: ${nameMatch ? 'YES' : 'NO'}`);
                console.log('');
            });
        } else {
            console.log('  ✅ No companies have redundant company_name field');
        }
    }

    // Check profiles with redundant company_name
    console.log('\n2. Checking profiles table for remaining company_name fields...');
    const { data: profilesWithRedundantNames, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, company_id')
        .not('company_name', 'is', null);

    if (profilesError) {
        console.error('Error checking profiles:', profilesError.message);
    } else {
        console.log(`Found ${profilesWithRedundantNames?.length || 0} profiles with redundant company_name field:`);
        if (profilesWithRedundantNames?.length > 0) {
            for (const profile of profilesWithRedundantNames) {
                // Get canonical company name for comparison
                let canonicalName = null;
                if (profile.company_id) {
                    const { data: company } = await supabase
                        .from('companies')
                        .select('name')
                        .eq('id', profile.company_id)
                        .single();
                    canonicalName = company?.name;
                }

                const nameMatch = canonicalName === profile.company_name;
                console.log(`  Profile ID: ${profile.id}`);
                console.log(`     User: ${profile.first_name} ${profile.last_name}`);
                console.log(`     Redundant company_name: "${profile.company_name}"`);
                console.log(`     Canonical company.name: "${canonicalName}"`);
                console.log(`     Names match: ${nameMatch ? 'YES' : 'NO'}`);
                console.log('');
            }
        } else {
            console.log('  ✅ No profiles have redundant company_name field');
        }
    }

    // Summary statistics
    console.log('\n=== SUMMARY ===');
    console.log(`Companies with redundant company_name: ${companiesWithRedundantNames?.length || 0}`);
    console.log(`Profiles with redundant company_name: ${profilesWithRedundantNames?.length || 0}`);

    if ((companiesWithRedundantNames?.length || 0) === 0 && (profilesWithRedundantNames?.length || 0) === 0) {
        console.log('\n🎉 SUCCESS: Priority 4 Data Redundancy Cleanup is COMPLETE!');
        console.log('   All redundant company_name fields have been cleaned up.');
        console.log('   The application now uses canonical companies.name as the single source of truth.');
    } else {
        console.log('\n⚠️  Manual cleanup may be needed for remaining redundant fields.');
    }
}

auditRemainingRedundancy().catch(console.error);
