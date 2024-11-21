import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const migrateUsers = async () => {
    // Fetch all users from the profiles table
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
        return;
    }

    for (const profile of profiles) {
        // Set the role to 'superadmin' for all users
        const role = 'superadmin';

        // Insert the user into the nts_users table
        const { error: insertError } = await supabase
            .from('nts_users')
            .insert({
                id: profile.id,
                profile_id: profile.id,
                company_id: profile.company_id,
                email: profile.email,
                role: role,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone_number: profile.phone_number,
                profile_picture: profile.profile_picture,
                address: profile.address,
                inserted_at: profile.inserted_at,
                email_notifications: profile.email_notifications,
            });

        if (insertError) {
            console.error(`Error inserting user ${profile.id} into nts_users:`, insertError.message);
        } else {
            console.log(`Migrated user ${profile.id} to nts_users with role ${role}`);
        }
    }
};

migrateUsers().catch(console.error);