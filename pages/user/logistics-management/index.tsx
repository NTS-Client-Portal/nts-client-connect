import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import QuoteRequest from '@/components/user/QuoteRequest';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import withProfileCheck from '@/components/hoc/withProfileCheck';

const FreightRFQPage: React.FC = () => {
    const session = useSession();
    const company = { id: 'company-id' };
    const profiles = [];
    const ntsUsers = [];
    
    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
            <QuoteRequest session={session} companyId={company.id} profiles={profiles} ntsUsers={ntsUsers} />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default withProfileCheck(FreightRFQPage);