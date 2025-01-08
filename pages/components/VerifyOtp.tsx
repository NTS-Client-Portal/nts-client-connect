import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import Link from 'next/link';

const VerifyOtpPage = () => {
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { email } = router.query;

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email: email as string,
                token: otp,
                type: 'signup',
            });

            if (error) {
                throw new Error(error.message);
            }

            router.push('/user/logistics-management');
        } catch (error) {
            setError(error.message);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setResendSuccess(false);
        setError(null);

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email as string,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}`
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setResendSuccess(true);
        }

        setResendLoading(false);
    };

    return (
        <>
            <Head>
                <title>Verify OTP</title>
                <meta name="description" content="Verify your OTP" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/hc-28.png" />
            </Head>
            <div className="w-full h-full bg-200">
                <div className="min-w-full min-h-screen flex items-center justify-center">
                    <div className="w-full h-full flex justify-center items-center p-4">
                        <div className="w-full h-full sm:h-auto sm:w-2/5 max-w-sm p-5 bg-white shadow flex flex-col text-base">
                            <span className="font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center">
                                Verify Your Email
                            </span>
                            <form onSubmit={handleVerifyOtp}>
                                {error && <div className="text-red-500 mb-4">{error}</div>}
                                <div className="mb-4">
                                    <label className="block text-gray-700">Enter OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                                >
                                    Verify OTP
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                                disabled={resendLoading}
                            >
                                {resendLoading ? 'Resending...' : 'Resend OTP'}
                            </button>
                            {resendSuccess && <div className="text-green-500 mt-2">OTP resent successfully!</div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyOtpPage;