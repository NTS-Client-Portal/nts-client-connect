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
    const { pathname, replace } = router;
    const { userProfile, loading } = useProfilesUser();
    const profiles = [];
    const companyId = userProfile?.company_id ?? null;

    React.useEffect(() => {
        if (loading) return;

        // Idle logout: Supabase clears the session. Send the user back to
        // the login page instead of leaving them on the profile-setup screen.
        if (!session) {
            replace('/');
            return;
        }

        if (session.user && !userProfile?.company_id && pathname !== '/profile-setup') {
            replace('/profile-setup');
        }
    }, [loading, pathname, replace, session, userProfile]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!session) {
        return null; // Redirecting to login
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