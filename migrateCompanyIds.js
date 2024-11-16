require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const updateCompanyIds = async () => {
    // Fetch all users with null company_id
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .is('company_id', null);

    if (usersError) {
        console.error('Error fetching users:', usersError.message);
        return;
    }

    for (const user of users) {
        // Generate a unique company_id
        const companyId = uuidv4();

        // Create a new company entry
        const { error: companyError } = await supabase
            .from('companies')
            .insert({
                id: companyId,
                name: `${user.first_name} ${user.last_name}`,
                size: '1-10', // Default size, adjust as needed
            });

        if (companyError) {
            console.error(`Error creating company for user ${user.id}:`, companyError.message);
            continue;
        }

        // Update the user's profile with the new company_id
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ company_id: companyId })
            .eq('id', user.id);

        if (updateError) {
            console.error(`Error updating user profile ${user.id}:`, updateError.message);
        } else {
            console.log(`Updated user ${user.id} with company_id ${companyId}`);
        }
    }
};

updateCompanyIds().catch(console.error);