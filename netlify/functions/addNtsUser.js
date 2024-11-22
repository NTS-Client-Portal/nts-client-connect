const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

exports.handler = async (event, context) => {
    const { email, role, first_name, last_name, phone_number, address } = JSON.parse(event.body);

    try {
        // Check if the user already exists in auth.users
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
            throw new Error(usersError.message);
        }
        const userExists = usersData.users.some(user => user.email === email);
        let userId;

        if (!userExists) {
            // Sign up the user in auth.users using the service role key
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: 'temporaryPassword123', // You can generate a random password or handle it differently
                email_confirm: true,
            });

            if (authError) {
                throw new Error(authError.message);
            }

            userId = authUser.user.id;
        } else {
            const existingUser = usersData.users.find(user => user.email === email);
            userId = existingUser?.id;
        }

        // Insert into nts_users table
        const ntsUserToInsert = {
            id: userId,
            email,
            role,
            first_name: first_name || null,
            last_name: last_name || null,
            phone_number: phone_number || null,
            address: address || null,
            email_notifications: false,
            inserted_at: new Date().toISOString(), // Set inserted_at to the current date and time
        };

        const { error: ntsUserError } = await supabaseAdmin.from('nts_users').insert([ntsUserToInsert]);
        if (ntsUserError) {
            throw new Error(ntsUserError.message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'NTS User added successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};