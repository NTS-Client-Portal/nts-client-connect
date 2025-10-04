const nodemailer = require('nodemailer');

// Debug: Log what we're using for authentication
console.log('🔧 Transporter Configuration:', {
    host: process.env.SMTP_HOST,
    port: 587,
    user: process.env.SENDGRID_USER,
    passLength: process.env.SENDGRID_API_KEY?.length,
    passPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10) + '...',
});

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
    
    // Debug: Log available environment variables
    console.log('🔍 Environment variables check:', {
        EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
        SENDGRID_USER: process.env.SENDGRID_USER || 'NOT SET',
        SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET (hidden)' : 'NOT SET'
    });
    
    if (event.httpMethod === 'POST') {
        const { to, subject, text, html, attachments } = JSON.parse(event.body || '{}');
        console.log('Parsed request body:', { to, subject, text, html, attachments });

        // Use a fallback email if EMAIL_USER is not set
        const fromEmail = process.env.EMAIL_USER || 'noreply@nationwidetransportservices.com';
        console.log('📧 Using from email:', fromEmail);

        const mailOptions = {
            from: {
                name: 'NTS Logistics',
                address: fromEmail
            }, // Using name + email format can help deliverability
            to,
            subject,
            text,
            html,
            attachments: attachments || [],
            // Add these headers to improve deliverability
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'NTS Logistics Platform'
            }
        };

        try {
            console.log('📧 Attempting to send email with options:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasHtml: !!mailOptions.html,
                hasText: !!mailOptions.text
            });
            
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', info);
            
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Email sent successfully', messageId: info.messageId }),
            };
        } catch (error) {
            console.error('❌ Error sending email:', {
                error: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            });
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Error sending email',
                    details: error.message,
                    code: error.code
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
