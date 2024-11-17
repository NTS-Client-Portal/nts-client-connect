import { v4 as uuidv4 } from 'uuid';
import { supabase } from './initSupabase'; // Adjust the import path as needed

const isValidUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

export const sendInvitations = async (emails: string[], userId: string, companyName: string) => {
    try {
        // Check if the company already exists
        const { data: existingCompany, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyName)
            .single();

        let companyId;

        if (companyError && companyError.code !== 'PGRST116') {
            throw new Error(companyError.message);
        }

        if (existingCompany) {
            companyId = existingCompany.id;
        } else {
            // Create a new company record
            const { data: newCompany, error: newCompanyError } = await supabase
                .from('companies')
                .insert({
                    name: companyName,
                })
                .select()
                .single();

            if (newCompanyError) {
                throw new Error(newCompanyError.message);
            }

            companyId = newCompany.id;
        }

        if (!isValidUUID(companyId)) {
            throw new Error(`Invalid company_id: ${companyId}`);
        }

        for (const email of emails) {
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
        }
    } catch (error) {
        console.error('Error sending invitations:', error);
    }
};