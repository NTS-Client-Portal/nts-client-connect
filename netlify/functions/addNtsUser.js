const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

exports.handler = async (event, context) => {
    const { email, role, first_name, last_name, phone_number, office, password, profile_picture } = JSON.parse(event.body);

    if (!email || !role || !first_name || !last_name || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Email, role, first name, last name, and password are required' }),
        };
    }

    try {
        console.log('Checking if user already exists...');
        // Check if the user already exists
        const { data: existingUsers, error: getUserError } = await supabaseAdmin
            .from('auth.users')
            .select('*')
            .eq('email', email);

        if (getUserError) {
            console.error('Error fetching existing user:', getUserError.message);
            throw new Error(getUserError.message);
        }

        let authUserId;

        if (existingUsers && existingUsers.length > 0) {
            console.log('User already exists:', existingUsers[0]);
            authUserId = existingUsers[0].id;
        } else {
            console.log('Signing up new user...');
            // Sign up the user with autoConfirm option
            const { user, error: signUpError } = await supabaseAdmin.auth.signUp({
                email,
                password,
            }, {
                data: {
                    first_name,
                    last_name,
                    phone_number,
                    office,
                    role,
                    profile_picture,
                },
                autoConfirm: true,
            });

            if (signUpError) {
                console.error('Error signing up user:', signUpError.message);
                throw new Error(signUpError.message);
            }

            console.log('New user signed up:', user);
            authUserId = user.id;
        }

        // Generate a unique ID for the new user
        const newUserId = uuidv4();

        console.log('Inserting user into nts_users table...');
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
            profile_picture,
        });

        if (insertError) {
            console.error('Error inserting user into nts_users:', insertError.message);
            throw new Error(insertError.message);
        }

        console.log('User inserted into nts_users table successfully');

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