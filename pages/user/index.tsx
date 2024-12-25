import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import QuoteRequest from '@/components/user/QuoteRequest';
import ShipperDash from '@/components/user/ShipperDash';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const ShipperDashboard: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <ShipperDash />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default ShipperDashboard;