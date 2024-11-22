import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const sendInvitations = async (inviteEmails: { email: string, role: string }[], userId: string, companyId: string) => {
    try {
        for (const invite of inviteEmails) {
            const { error } = await supabase
                .from('invitations')
                .insert({
                    email: invite.email,
                    team_role: invite.role,
                    company_id: companyId,
                    invited_by: userId,
                });

            if (error) {
                throw new Error(error.message);
            }
        }
    } catch (error) {
        console.error('Error sending invitations:', error.message);
        throw error;
    }
};