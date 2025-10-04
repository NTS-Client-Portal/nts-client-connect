import { Handler } from '@netlify/functions';
import { sendEmail } from '@lib/sgEmail';

const handler: Handler = async (event, context) => {
    if (event.httpMethod === 'POST') {
        try {
            const { to, subject, text, html, attachments } = JSON.parse(event.body || '{}');
            
            console.log('📧 Sending email:', { to, subject });
            
            if (!to) {
                console.error('❌ Missing "to" field');
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing required field: to' }),
                };
            }
            
            if (!subject) {
                console.error('❌ Missing "subject" field');
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing required field: subject' }),
                };
            }

            await sendEmail(to, subject, text, html, attachments);
            console.log('✅ Email sent successfully to:', to);
            
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Email sent successfully', to }),
            };
        } catch (error) {
            console.error('❌ Error sending email:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Error sending email', 
                    details: error instanceof Error ? error.message : String(error)
                }),
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
