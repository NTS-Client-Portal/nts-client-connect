import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

const createSuperadminUser = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (error) {
        console.error('Error creating superadmin user:', error.message);
        return res.status(500).json({ error: error.message });
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
        return res.status(500).json({ error: profileError.message });
    }

    console.log('Superadmin user created successfully');
    return res.status(200).json({ message: 'Superadmin user created successfully' });
};

export default createSuperadminUser;