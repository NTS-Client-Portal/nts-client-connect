import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { inviteEmails, userId, companyId } = req.body;

        try {
            for (const invite of inviteEmails) {
                const token = uuidv4();

                const { error } = await supabase
                    .from('invitations')
                    .insert({
                        email: invite.email,
                        team_role: invite.role,
                        company_id: companyId,
                        invited_by: userId,
                        token,
                    });

                if (error) {
                    throw new Error(error.message);
                }

                const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite?token=${token}`;

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: invite.email,
                    subject: 'You are invited to join our team',
                    text: `You have been invited to join our team. Please click the following link to complete your registration: ${inviteLink}`,
                    html: `<p>You have been invited to join our team. Please click the following link to complete your registration:</p><p><a href="${inviteLink}">${inviteLink}</a></p>`,
                };

                await transporter.sendMail(mailOptions);
            }

            res.status(200).json({ message: 'Invitations sent successfully' });
        } catch (error) {
            console.error('Error sending invitations:', error.message);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}