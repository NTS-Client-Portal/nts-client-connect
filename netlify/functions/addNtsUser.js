const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.NEXT_PUBLIC_DEFAULT_PASSWORD;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

exports.handler = async (event, context) => {
    const { email, role, first_name, last_name, phone_number, office } = JSON.parse(event.body);

    if (!email || !role || !first_name || !last_name) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Email, role, first name, and last name are required' }),
        };
    }

    try {
        // Sign up the user in Supabase Auth
        const { data, error: signUpError } = await supabaseAdmin.auth.signUp({
            email,
            password: defaultPassword, // Use the default password from the environment variable
        });

        if (signUpError) {
            throw new Error(signUpError.message);
        }

        const authUserId = data.user?.id;

        if (!authUserId) {
            throw new Error('Failed to get user ID from sign-up response');
        }

        // Generate a unique ID for the new user
        const newUserId = uuidv4();

        // Insert the user into the nts_users table with the specified company_id
        const { error: insertError } = await supabaseAdmin.from('nts_users').insert({
            id: newUserId,
            email,
            role,
            first_name,
            last_name,
            phone_number,
            office,
            company_id: 'cc0e2fd6-e5b5-4a7e-b375-7c0d28e2b45d', // Set the company_id field
            inserted_at: new Date().toISOString(),
            auth_uid: authUserId,
        });

        if (insertError) {
            throw new Error(insertError.message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'NTS User added successfully' }),
        };
    } catch (error) {
        console.error('Error adding NTS User:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};