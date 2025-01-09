import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';
import { GetServerSideProps } from 'next';

const MagicLink = ({ email, token }: { email: string; token: string }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleMagicLink = async () => {
            console.log('Email:', email);
            console.log('Token:', token);

            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'magiclink',
            });

            if (error) {
                setError(error.message);
                console.error('Error verifying OTP:', error.message);
            } else {
                // Check if the user is an NTS user
                const { data: ntsUser, error: ntsUserError } = await supabase
                    .from('nts_users')
                    .select('company_id')
                    .eq('email', email)
                    .single();

                if (ntsUserError) {
                    console.log('User is not an NTS user:', ntsUserError.message);
                    // If the user is not an NTS user, redirect to the login page
                    router.push('/login');
                } else {
                    console.log('User is an NTS user:', ntsUser);
                    // If the user is an NTS user, redirect to the set password page
                    router.push('/nts-set-password');
                }
            }
            setLoading(false);
        };

        if (email && token) {
            handleMagicLink();
        }
    }, [email, token]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { email, token } = context.query;

    if (!email || !token) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            email: email as string,
            token: token as string,
        },
    };
};

export default MagicLink;