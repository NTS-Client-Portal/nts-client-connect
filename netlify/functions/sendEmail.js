const { sendEmail } = require('./../lib/sgEmail');

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    if (event.httpMethod === 'POST') {
        const { to, subject, text, attachments } = JSON.parse(event.body || '{}');
        console.log('Parsed request body:', { to, subject, text, attachments });

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