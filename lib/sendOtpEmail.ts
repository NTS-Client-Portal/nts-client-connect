import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOtpEmail = async (email: string, otp: string) => {
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
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};