import axios from 'axios';

export const sendInvitations = async (inviteEmails: { email: string, role: string }[], userId: string, companyId: string) => {
    try {
        const response = await axios.post('/api/send-invitation', {
            inviteEmails,
            userId,
            companyId,
        });

        if (response.status !== 200) {
            throw new Error(response.data.error);
        }
    } catch (error) {
        console.error('Error sending invitations:', error.message);
        throw error;
    }
};