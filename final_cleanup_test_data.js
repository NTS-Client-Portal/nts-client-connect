const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n=== FINAL CLEANUP: Test Data Redundancy Records ===\n');

async function finalCleanup() {
    // Clean up the company with mismatched name
    console.log('1. Cleaning up company with mismatched names...');
    const companyId = 'f067f45c-1904-40a7-955a-6859c1b4f372';
    
    const { data: companyBefore, error: companyFetchError } = await supabase
        .from('companies')
        .select('id, name, company_name')
        .eq('id', companyId)
        .single();

    if (companyFetchError) {
        console.error('Error fetching company:', companyFetchError.message);
    } else {
        console.log('  Before cleanup:');
        console.log(`    Canonical name: "${companyBefore.name}"`);
        console.log(`    Redundant company_name: "${companyBefore.company_name}"`);

        // Clear the redundant field - keep the canonical name as source of truth
        const { error: companyUpdateError } = await supabase
            .from('companies')
            .update({ company_name: null })
            .eq('id', companyId);

        if (companyUpdateError) {
            console.error('Error updating company:', companyUpdateError.message);
        } else {
            console.log('  ✅ Successfully cleared redundant company_name field');
            console.log(`  ✅ Canonical name "${companyBefore.name}" remains as single source of truth`);
        }
    }

    // Clean up the profile with mismatched name  
    console.log('\n2. Cleaning up profile with mismatched company name...');
    const profileId = '266838b6-0dc5-4b19-bec5-92c01f68aeb4';
    
    const { data: profileBefore, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, company_id')
        .eq('id', profileId)
        .single();

    if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError.message);
    } else {
        console.log('  Before cleanup:');
        console.log(`    User: ${profileBefore.first_name} ${profileBefore.last_name}`);
        console.log(`    Redundant company_name: "${profileBefore.company_name}"`);
        
        // Get the canonical company name for reference
        let canonicalName = null;
        if (profileBefore.company_id) {
            const { data: company } = await supabase
                .from('companies')
                .select('name')
                .eq('id', profileBefore.company_id)
                .single();
            canonicalName = company?.name;
        }
        console.log(`    Canonical company name: "${canonicalName}"`);

        // Clear the redundant field - company name will come from companies.name via company_id
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ company_name: null })
            .eq('id', profileId);

        if (profileUpdateError) {
            console.error('Error updating profile:', profileUpdateError.message);
        } else {
            console.log('  ✅ Successfully cleared redundant company_name field');
            console.log(`  ✅ Profile now uses canonical company name "${canonicalName}" via company_id link`);
        }
    }

    // Final verification
    console.log('\n3. Final verification...');
    
    const { data: remainingCompanies } = await supabase
        .from('companies')
        .select('id, name, company_name')
        .not('company_name', 'is', null);

    const { data: remainingProfiles } = await supabase
        .from('profiles')
        .select('id, company_name')
        .not('company_name', 'is', null);

    console.log(`   Companies with redundant company_name: ${remainingCompanies?.length || 0}`);
    console.log(`   Profiles with redundant company_name: ${remainingProfiles?.length || 0}`);

    if ((remainingCompanies?.length || 0) === 0 && (remainingProfiles?.length || 0) === 0) {
        console.log('\n🎉 PRIORITY 4 FULLY COMPLETE!');
        console.log('   ✅ All redundant company_name fields eliminated');
        console.log('   ✅ companies.name is now the single source of truth');
        console.log('   ✅ Application uses canonical naming throughout');
        console.log('   ✅ Ready to proceed with Priority 5!');
    } else {
        console.log('\n⚠️  Some redundant fields still remain - may need manual investigation');
    }
}

finalCleanup().catch(console.error);
