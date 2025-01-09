import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';

const MagicLink = () => {
    const router = useRouter();
    const { userProfile, loading: ntsLoading, error: ntsError } = useNtsUsers();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleMagicLink = async () => {
            console.log('Email:', router.query.email);
            console.log('Token:', router.query.token);

            const { error } = await supabase.auth.verifyOtp({
                email: router.query.email as string,
                token: router.query.token as string,
                type: 'magiclink',
            });

            if (error) {
                setError(error.message);
                console.error('Error verifying OTP:', error.message);
            } else {
                if (userProfile) {
                    console.log('User is an NTS user:', userProfile);
                    // If the user is an NTS user, redirect to the set password page
                    router.push('/nts-set-password');
                } else {
                    console.log('User is not an NTS user');
                    // If the user is not an NTS user, redirect to the user home page
                    router.push('/user/logistics-management/');
                }
            }
            setLoading(false);
        };

        if (router.query.email && router.query.token) {
            handleMagicLink();
        }
    }, [router.query.email, router.query.token, userProfile]);

    if (loading || ntsLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {ntsError && <div className="text-red-500 mb-4">{ntsError}</div>}
        </div>
    );
};

export default MagicLink;