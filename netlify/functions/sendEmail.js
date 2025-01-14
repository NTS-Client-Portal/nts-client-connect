const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_API_KEY,
    },
});

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    if (event.httpMethod === 'POST') {
        const { to, subject, text, html, attachments } = JSON.parse(event.body || '{}');
        console.log('Parsed request body:', { to, subject, text, html, attachments });

        const mailOptions = {
            from: process.env.EMAIL_USER, // Ensure this is a verified sender identity
            to,
            subject,
            text,
            html,
            attachments: attachments || [],
        };

        try {
            await transporter.sendMail(mailOptions);
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