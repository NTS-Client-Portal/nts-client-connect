import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key here
const supabase = createClient(supabaseUrl, supabaseKey);

const insertSuperadmin = async () => {
    try {
        // Step 1: Sign Up User
        const { data: authUser, error: authError } = await supabase.auth.signUp({
            email: 'noah@ntslogistics.com',
            password: '', // You can generate a random password or handle it differently
        });

        if (authError) {
            console.error('Error signing up user:', authError.message);
            return;
        }

        console.log('Superadmin user created successfully');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
};