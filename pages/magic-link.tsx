import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';
import { GetServerSideProps } from 'next';
import { useNtsUsers } from '@/context/NtsUsersContext';

const MagicLink = ({ email, token }: { email: string; token: string }) => {
    const router = useRouter();
    const { userProfile, loading: ntsLoading, error: ntsError } = useNtsUsers();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleMagicLink = async () => {
            if (!email || !token) return;
    
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
            } else if (userProfile) {
                if (userProfile.profileType === 'nts_users') {
                    console.log('User is an NTS user:', email);
                    router.push('/nts/nts-set-password');
                } else {
                    console.log('User is not an NTS user:', email);
                    router.push('/user/logistics-management/');
                }
            }
            setLoading(false);
        };
    
        if (userProfile && email && token) {
            handleMagicLink();
        }
    }, [email, token, userProfile]);
    

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