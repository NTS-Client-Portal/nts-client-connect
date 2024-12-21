import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import QuoteRequest from '@/components/user/QuoteRequest';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const FreightRFQPage: React.FC = () => {
    const session = useSession();
    const company = { id: 'company-id' };
    const profiles = [];
    const ntsUsers = [];
    const isAdmin = false; // or true, depending on your logic

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <QuoteRequest session={session} profiles={profiles} ntsUsers={ntsUsers} isAdmin={isAdmin} />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default FreightRFQPage;