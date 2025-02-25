import { Handler } from '@netlify/functions';
import { sendEmail } from '@lib/sgemail.mjs';

const handler: Handler = async (event, context) => {
    if (event.httpMethod === 'POST') {
        const { to, subject, text, attachments } = JSON.parse(event.body || '{}');

        try {
            await sendEmail(to, subject, text, attachments);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Email sent successfully' }),
            };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error sending email' }),
            };
        }
    } else {
        return {
            statusCode: 405,
            headers: {
                Allow: 'POST',
            },
            body: `Method ${event.httpMethod} Not Allowed`,
        };
    }
};

export { handler };