const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

sgMail.setApiKey(process.env.SENDGRID_PASS);

exports.handler = async function (event, context) {
    if (event.httpMethod === 'POST') {
        const { email, firstName, lastName, phoneNumber, companyId, companyName, companySize, industry } = JSON.parse(event.body);

        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: {
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    company_id: companyId,
                    company_name: companyName,
                    company_size: companySize,
                    industry: industry,
                    profile_complete: true,
                    team_role: 'manager',
                },
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/invite`,
                    data: {
                        send_email: false, // Disable the default Supabase email
                    },
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            const userId = data.user?.id;

            if (!userId) {
                throw new Error('User ID not found');
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId, // Use the user ID from auth.users
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    company_id: companyId,
                    company_name: companyName,
                    company_size: companySize,
                    industry: industry,
                    profile_complete: true,
                    team_role: 'manager',
                });

            if (profileError) {
                throw new Error(profileError.message);
            }

            // Send magic link for setting the password
            const { data: magicLinkData, error: signInError } = await supabase.auth.api.generateLink({
                type: 'magiclink',
                email,
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/invite`,
                },
            });

            if (signInError) {
                throw new Error(signInError.message);
            }

            const magicLink = magicLinkData.action_link;

            const msg = {
                to: email,
                from: process.env.EMAIL_USER, // Use your verified SendGrid sender email
                subject: `${companyName} invited you to join the team on shipper-connect`,
                text: `${firstName}, You have been invited to join our team. Please click the following link to complete your registration: ${magicLink}`,
                html: `<p>${firstName}, You have been invited to join our team. Please click the following link to complete your registration:</p><p><a href="${magicLink}">${magicLink}</a></p>`,
            };

            try {
                await sgMail.send(msg);
            } catch (sendError) {
                console.error('Error sending email:', sendError.response ? sendError.response.body : sendError.message);
                throw new Error(sendError.message);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'User created and invitation sent successfully' }),
            };
        } catch (error) {
            console.error('Error creating user:', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }
    } else {
        return {
            statusCode: 405,
            headers: { Allow: 'POST' },
            body: `Method ${event.httpMethod} Not Allowed`,
        };
    }
};