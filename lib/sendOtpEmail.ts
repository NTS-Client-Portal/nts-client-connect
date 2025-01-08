export const sendOtpEmail = async (email: string, otp: string) => {
    try {
        const response = await fetch('/.netlify/functions/sendOtpEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            throw new Error('Failed to send OTP email');
        }

        console.log(`OTP ${otp} sent to email ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};