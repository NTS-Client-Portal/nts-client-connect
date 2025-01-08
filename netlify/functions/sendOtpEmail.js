const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
    const { email, otp } = JSON.parse(event.body);

    const msg = {
        to: email,
        from: 'noah@ntslogistics.com', // Use your verified sender email
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`,
        html: `<strong>Your OTP code is ${otp}</strong>`,
    };

    try {
        await sgMail.send(msg);
        console.log(`OTP ${otp} sent to email ${email}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'OTP sent successfully' }),
        };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send OTP email' }),
        };
    }
};