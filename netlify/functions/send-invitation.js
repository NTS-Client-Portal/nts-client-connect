const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

sgMail.setApiKey(process.env.SENDGRID_PASS);

exports.handler = async function (event, context) {
    if (event.httpMethod === 'POST') {
        const { inviteEmails, userId, companyId } = JSON.parse(event.body);

        try {
            for (const invite of inviteEmails) {
                const { data, error } = await supabase.auth.api.generateLink({
                    type: 'magiclink',
                    email: invite.email,
                    options: {
                        emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/invite`,
                    },
                });

                if (error) {
                    console.error('Error generating magic link:', error.message);
                    throw new Error(error.message);
                }

                const magicLink = data.action_link;

                const msg = {
                    to: invite.email,
                    from: process.env.EMAIL_USER, // Use your verified SendGrid sender email
                    subject: 'You are invited to join our team',
                    text: `You have been invited to join our team. Please click the following link to complete your registration: ${magicLink}`,
                    html: `<p>You have been invited to join our team. Please click the following link to complete your registration:</p><p><a href="${magicLink}">${magicLink}</a></p>`,
                };

                try {
                    await sgMail.send(msg);
                } catch (sendError) {
                    console.error('Error sending email:', sendError.response ? sendError.response.body : sendError.message);
                    throw new Error(sendError.message);
                }
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Invitations sent successfully' }),
            };
        } catch (error) {
            console.error('Error sending invitations:', error.message);
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