import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

const createSuperadminUser = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Hardcoded user and password
    const email = 'noah@ntslogistics.com';
    const password = 'Adam123!';

    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            console.error('Error creating superadmin user:', error.message);
            console.error('Full error response:', error);
            return res.status(500).json({ error: error.message, details: error });
        }

        const userId = data.user?.id;
        if (!userId) {
            console.error('User ID not found in response');
            return res.status(500).json({ error: 'User ID not found in response' });
        }

        // Insert the user's profile into the profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email,
                role: 'superadmin',
                first_name: 'Super',
                last_name: 'Admin',
            });

        if (profileError) {
            console.error('Error inserting superadmin profile:', profileError.message);
            console.error('Full error response:', profileError);
            return res.status(500).json({ error: profileError.message, details: profileError });
        }

        console.log('Superadmin user created successfully');
        return res.status(200).json({ message: 'Superadmin user created successfully' });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Unexpected error', details: error.message });
    }
};

export default createSuperadminUser;