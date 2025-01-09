import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';

const MagicLink = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleMagicLink = async () => {
            const { error } = await supabase.auth.verifyOtp({
                email: router.query.email as string,
                token: router.query.token as string,
                type: 'magiclink',
            });

            if (error) {
                setError(error.message);
            } else {
                // Check user type and redirect accordingly
                const { data, error: userError } = await supabase.auth.getUser();
                if (userError) {
                    setError(userError.message);
                } else if (data.user) {
                    const { data: ntsUser, error: ntsUserError } = await supabase
                        .from('nts_users')
                        .select('company_id')
                        .eq('email', data.user.email)
                        .single();

                    if (ntsUserError) {
                        // If the user is not an NTS user, check if they are in the profiles table
                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('email', data.user.email)
                            .single();

                        if (profileError) {
                            setError(profileError.message);
                        } else {
                            // If the user is in the profiles table, redirect to the user home page
                            router.push('/user/logistics-management/');
                        }
                    } else {
                        // If the user is an NTS user, redirect to the set password page
                        router.push('/nts-set-password');
                    }
                }
            }
            setLoading(false);
        };

        if (router.query.email && router.query.token) {
            handleMagicLink();
        }
    }, [router.query.email, router.query.token]);

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

export default MagicLink;