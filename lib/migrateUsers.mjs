import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const updateTeamRoles = async () => {
    // Fetch all users without a team_role
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .is('team_role', null);

    if (usersError) {
        console.error('Error fetching users:', usersError.message);
        return;
    }

    for (const user of users) {
        // Skip users with null company_id
        if (!user.company_id) {
            console.warn(`Skipping user ${user.id} with null company_id`);
            continue;
        }

        // Check if the user is the first in their company
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', user.company_id);

        if (profilesError) {
            console.error(`Error fetching profiles for company_id ${user.company_id}:`, profilesError.message);
            continue;
        }

        const teamRole = profiles.length === 1 ? 'manager' : 'member';

        // Update the user's profile with the appropriate team_role
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ team_role: teamRole })
            .eq('id', user.id);

        if (updateError) {
            console.error(`Error updating user profile ${user.id}:`, updateError.message);
        } else {
            console.log(`Updated user ${user.id} with role ${teamRole}`);
        }
    }
};

updateTeamRoles().catch(console.error);