import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Head from 'next/head';

const InvitePage = () => {
    const router = useRouter();
    const supabase = useSupabaseClient();
    const { token } = router.query;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                const { data, error } = await supabase
                    .from('invitations')
                    .select('email')
                    .eq('token', token)
                    .single();

                if (error) {
                    setError('Invalid or expired invitation token');
                } else {
                    setEmail(data.email);
                }
            }
        };

        verifyToken();
    }, [token, supabase]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const { user, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                throw new Error(signUpError.message);
            }

            // Update the user's profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ profile_complete: true })
                .eq('email', email);

            if (profileError) {
                throw new Error(profileError.message);
            }

            // Delete the invitation token
            await supabase
                .from('invitations')
                .delete()
                .eq('token', token);

            setSuccess(true);
            router.push('/user/freight-rfq');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Complete Your Invitation</title>
                <meta name="description" content="Complete your invitation and set up your account" />
            </Head>
            <div className="w-full h-full bg-200">
                <div className="md:grid min-w-full min-h-screen md:grid-cols-1 ">
                    <div className="sm:row-span-1 md:col-span-1 w-full h-full flex flex-col justify-center items-center bg-zinc-100">
                        <div className=" w-full text-zinc-900 h-full sm:h-auto sm:w-full max-w-md p-5 bg-white shadow flex flex-col justify-center items-center text-base">
                            <h2 className="mt-12 md:mt-0 text-2xl font-bold text-center">Complete Your Invitation</h2>
                            <div className="xs:w-2/5 md:w-full h-full sm:h-auto p-5 bg-white shadow flex flex-col text-base">
                                <span className="font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center">
                                    Set Up Your Account
                                </span>
                                {error && <div className="text-red-500 text-center mb-4">{error}</div>}
                                {success ? (
                                    <div className="text-green-500 text-center mb-4 border border-zinc-900 p-4 rounded">
                                        Your account has been set up successfully! Redirecting...
                                    </div>
                                ) : (
                                    <form className="mt-4" onSubmit={handleSignUp}>
                                        <label htmlFor="email" className="mt-4">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            readOnly
                                            className="w-full p-2 mt-2 border rounded bg-gray-200"
                                        />
                                        <label htmlFor="password" className="mt-4">Password</label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full p-2 mt-2 border rounded"
                                            disabled={loading}
                                            autoComplete="new-password"
                                        />
                                        <label htmlFor="confirmPassword" className="mt-4">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full p-2 mt-2 border rounded"
                                            disabled={loading}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full body-btn mt-8"
                                            disabled={loading}
                                        >
                                            {loading ? 'Setting Up...' : 'Set Up Account'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvitePage;