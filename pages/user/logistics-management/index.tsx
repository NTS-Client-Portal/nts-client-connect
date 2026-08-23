import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import QuoteRequest from '@/components/user/QuoteRequest';
import UserLayout from '@/pages/components/UserLayout';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

const FreightRFQPage: React.FC = () => {
    const session = useSession();
    const router = useRouter();
    const { userProfile, loading } = useProfilesUser();
    const profiles = [];
    const companyId = userProfile?.company_id ?? null;

    React.useEffect(() => {
        if (!loading && session?.user && !userProfile && router.pathname !== '/profile-setup') {
            router.replace('/profile-setup');
        }
    }, [loading, router, session, userProfile]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!companyId) {
        return <p>Redirecting you to profile setup...</p>;
    }

    return (
        <NtsUsersProvider>
            <UserLayout>
                <QuoteRequest
                    session={session}
                    profiles={profiles}
                    companyId={companyId}
                    userType="shipper"
                />
            </UserLayout>
        </NtsUsersProvider>
    );
};

export default FreightRFQPage;