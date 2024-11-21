const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

exports.handler = async (event, context) => {
    console.log('Function invoked');
    const { email, role, first_name, last_name, phone_number, address } = JSON.parse(event.body);

    try {
        console.log('Checking if user exists');
        // Check if the user already exists in auth.users
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
            console.error('Error listing users:', usersError.message);
            throw new Error(usersError.message);
        }
        const userExists = usersData.users.some(user => user.email === email);
        let userId;
        let newProfileId;

        if (!userExists) {
            console.log('User does not exist, creating new user');
            // Generate a new profile_id
            const { data, error } = await supabaseAdmin
                .from('nts_users')
                .select('profile_id')
                .order('profile_id', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error generating profile_id:', error.message);
                throw new Error(error.message);
            }

            const latestProfileId = data.length > 0 ? data[0].profile_id : 'N0000';
            const newProfileIdNumber = parseInt(latestProfileId.slice(1)) + 1;
            newProfileId = `N${newProfileIdNumber.toString().padStart(4, '0')}`;

            // Sign up the user in auth.users using the service role key
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: 'NtsBlue123!', // You can generate a random password or handle it differently
                email_confirm: true,
            });

            if (authError) {
                console.error('Error creating user:', authError.message);
                throw new Error(authError.message);
            }

            userId = authUser.user.id;
        } else {
            console.log('User exists, fetching user ID');
            const existingUser = usersData.users.find(user => user.email === email);
            userId = existingUser?.id;

            // Generate a new profile_id for existing users
            const { data, error } = await supabaseAdmin
                .from('nts_users')
                .select('profile_id')
                .order('profile_id', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error generating profile_id:', error.message);
                throw new Error(error.message);
            }

            const latestProfileId = data.length > 0 ? data[0].profile_id : 'N0000';
            const newProfileIdNumber = parseInt(latestProfileId.slice(1)) + 1;
            newProfileId = `N${newProfileIdNumber.toString().padStart(4, '0')}`;
        }

        console.log('Inserting into profiles table');
        // Insert into profiles table
        const profileToInsert = {
            id: userId,
            email,
            first_name: first_name || null,
            last_name: last_name || null,
            phone_number: phone_number || null,
            company_id: uuidv4(), // Assign a random company_id
            profile_picture: null,
            address: address || null,
            email_notifications: null,
            team_role: null,
            assigned_sales_user: null,
            company_name: null,
            company_size: null,
            profile_complete: true,
            inserted_at: new Date().toISOString(), // Set inserted_at to the current date and time
        };

        const { error: profileError } = await supabaseAdmin.from('profiles').insert([profileToInsert]);
        if (profileError) {
            console.error('Error inserting into profiles table:', profileError.message);
            throw new Error(profileError.message);
        }

        console.log('Inserting into nts_users table');
        // Insert into nts_users table
        const ntsUserToInsert = {
            id: userId,
            profile_id: newProfileId,
            company_id: uuidv4(), // Assign a random company_id
            email,
            role,
            first_name: first_name || null,
            last_name: last_name || null,
            phone_number: phone_number || null,
            profile_picture: null,
            address: address || null,
            email_notifications: false,
            inserted_at: new Date().toISOString(), // Set inserted_at to the current date and time
        };

        const { error: ntsUserError } = await supabaseAdmin.from('nts_users').insert([ntsUserToInsert]);
        if (ntsUserError) {
            console.error('Error inserting into nts_users table:', ntsUserError.message);
            throw new Error(ntsUserError.message);
        }

        console.log('NTS User added successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'NTS User added successfully' }),
        };
    } catch (error) {
        console.error('Error in function:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};