import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Email and password are required' }),
        };
    }

    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            console.error('Error creating superadmin user:', error.message);
            console.error('Full error response:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message, details: error }),
            };
        }

        const userId = data.user?.id;
        if (!userId) {
            console.error('User ID not found in response');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'User ID not found in response' }),
            };
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
            return {
                statusCode: 500,
                body: JSON.stringify({ error: profileError.message, details: profileError }),
            };
        }

        console.log('Superadmin user created successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Superadmin user created successfully' }),
        };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Unexpected error', details: error.message }),
        };
    }
};