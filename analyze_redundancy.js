const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDataRedundancy() {
  console.log('🔍 Analyzing Data Redundancy Issues...\n');

  try {
    // 1. Check companies table structure and data
    console.log('📊 Companies Table Analysis:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, company_name')
      .limit(10);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
    } else {
      console.log(`   Total companies sample: ${companies.length}`);
      
      // Check if company_name column exists and has different values than name
      let redundantCount = 0;
      let mismatchCount = 0;
      
      companies.forEach(company => {
        if (company.company_name) {
          if (company.name !== company.company_name) {
            mismatchCount++;
            console.log(`   ⚠️  Mismatch: name="${company.name}" vs company_name="${company.company_name}"`);
          } else {
            redundantCount++;
          }
        }
      });
      
      console.log(`   📈 Redundant entries: ${redundantCount}`);
      console.log(`   ⚠️  Mismatched entries: ${mismatchCount}`);
    }

    // 2. Check profiles table for company_name redundancy
    console.log('\n👥 Profiles Table Analysis:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        company_name, 
        company_id,
        companies!inner(name)
      `)
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`   Total profiles sample: ${profiles.length}`);
      
      let profileRedundantCount = 0;
      let profileMismatchCount = 0;
      
      profiles.forEach(profile => {
        if (profile.company_name && profile.companies) {
          if (profile.company_name !== profile.companies.name) {
            profileMismatchCount++;
            console.log(`   ⚠️  Mismatch: profile.company_name="${profile.company_name}" vs companies.name="${profile.companies.name}"`);
          } else {
            profileRedundantCount++;
          }
        }
      });
      
      console.log(`   📈 Redundant entries: ${profileRedundantCount}`);
      console.log(`   ⚠️  Mismatched entries: ${profileMismatchCount}`);
    }

    // 3. Check for quotes that might reference company_name directly
    console.log('\n📋 Quotes Analysis:');
    const { count: quotesCount } = await supabase
      .from('shippingquotes')
      .select('*', { count: 'exact', head: true });

    console.log(`   Total quotes: ${quotesCount}`);

    // 4. Identify potential cleanup impact
    console.log('\n🎯 Cleanup Impact Assessment:');
    
    const { count: companiesTotal } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
      
    const { count: profilesTotal } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`   📊 Total companies: ${companiesTotal}`);
    console.log(`   👥 Total profiles: ${profilesTotal}`);
    console.log(`   📋 Total quotes: ${quotesCount}`);
    
    console.log('\n✨ Analysis Complete!');
    
  } catch (error) {
    console.error('💥 Analysis error:', error);
  }
  
  process.exit(0);
}

analyzeDataRedundancy();
