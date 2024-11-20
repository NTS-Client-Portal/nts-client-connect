import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cbarvnrqvxroetrcuikv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYXJ2bnJxdnhyb2V0cmN1aWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2ODE5OTIsImV4cCI6MjA0NzI1Nzk5Mn0.YkCC6aBkImxterKD-Wr04x5kNVf7i3wpVjwnDMWa_JI'; // Use the service role key here
const supabase = createClient(supabaseUrl, supabaseKey);

const insertSuperadmin = async () => {
    try {
        // Step 1: Sign Up User
        const { data: authUser, error: authError } = await supabase.auth.signUp({
            email: 'noah@ntslogistics.com',
            password: 'Und3ri0@th', // You can generate a random password or handle it differently
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

insertSuperadmin();