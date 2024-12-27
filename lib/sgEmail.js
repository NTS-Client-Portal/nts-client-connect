const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env file
if (process.env.NODE_ENV !== 'production') dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: {
        user: process.env.SENDGRID_USER, // Your SendGrid username
        pass: process.env.SENDGRID_PASS, // Your SendGrid password
    },
});

const sendEmail = async (to, subject, text, html, attachments = []) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Your email address
        to,
        subject,
        text,
        html,
        attachments,
    };

    try {
        console.log('Sending email with options:', mailOptions);
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };