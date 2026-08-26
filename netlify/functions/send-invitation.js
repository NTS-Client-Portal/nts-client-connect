const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const sgMail = require('@sendgrid/mail');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

sgMail.setApiKey(process.env.SENDGRID_PASS);

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { Allow: 'POST' },
            body: `Method ${event.httpMethod} Not Allowed`,
        };
    }

    const { inviteEmails, userId, companyId } = JSON.parse(event.body);

    try {
        for (const invite of inviteEmails) {
            const token = uuidv4();

            const { error: inviteError } = await supabase
                .from('invitations')
                .insert({
                    email: invite.email,
                    team_role: invite.role,
                    company_id: companyId,
                    invited_by: userId,
                    token,
                });

            if (inviteError) {
                throw new Error(inviteError.message);
            }

            const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_REDIRECT_URL || '').replace(/\/+$/, '');
            const inviteLink = `${baseUrl}/invite?token=${token}`;

            const msg = {
                to: invite.email,
                from: process.env.EMAIL_USER,
                subject: 'You are invited to join our team',
                text: `You have been invited to join our team. Please click the following link to complete your registration: ${inviteLink}`,
                html: `<p>You have been invited to join our team. Please click the following link to complete your registration:</p><p><a href="${inviteLink}">${inviteLink}</a></p>`,
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
};