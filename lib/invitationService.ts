import { v4 as uuidv4 } from 'uuid';
import { supabase } from './initSupabase'; // Adjust the import path as needed

export const sendInvitations = async (emails: { email: string, role: 'manager' | 'member' }[], userId: string, companyName: string) => {
    try {
        // Check if the company already exists
        const { data: existingCompany, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyName)
            .single();

        let companyId: string;

        if (companyError && companyError.code !== 'PGRST116') {
            throw new Error(companyError.message);
        }

        if (existingCompany) {
            companyId = existingCompany.id as string;
        } else {
            // Create a new company
            const { data: newCompany, error: newCompanyError } = await supabase
                .from('companies')
                .insert({ id: uuidv4(), name: companyName })
                .select('id')
                .single();

            if (newCompanyError) {
                throw new Error(newCompanyError.message);
            }

            companyId = newCompany.id as string;
        }

        for (const { email, role } of emails) {
            const token = uuidv4();

            // Insert the invitation into the database
            const { error: invitationError } = await supabase
                .from('invitations')
                .insert({
                    id: uuidv4(),
                    email,
                    team_role: role,
                    token,
                    company_id: companyId,
                    invited_by: userId,
                });

            if (invitationError) {
                throw new Error(invitationError.message);
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
                const errorText = await response.text();
                console.error('Error response from sendEmail API:', errorText);
                throw new Error('Failed to send invitation email');
            }
        }
    } catch (error) {
        console.error('Error sending invitations:', error);
    }
};