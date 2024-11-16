import { v4 as uuidv4 } from 'uuid';
import { supabase } from './initSupabase'; // Adjust the import path as needed

export const sendInvitations = async (emails: string[], userId: string, companyId: string) => {
    if (!uuidv4().test(companyId)) {
        console.error('Invalid company_id:', companyId);
        return;
    }

    for (const email of emails) {
        try {
            // Generate a unique token
            const token = uuidv4();

            // Store the invitation token in the database
            const { error: insertError } = await supabase
                .from('invitations')
                .insert({
                    email,
                    token,
                    invited_by: userId,
                    company_id: companyId,
                });

            if (insertError) {
                throw new Error(insertError.message);
            }

            // Send the invitation email with the unique link
            const invitationLink = `${process.env.NEXT_PUBLIC_REDIRECT_URL}/invite?token=${token}`;
            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: email,
                    subject: 'Invitation to join NTS Portal',
                    text: `You have been invited to join NTS Portal. Please sign up using the following link: ${invitationLink}`,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send invitation email');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
        }
    }
};