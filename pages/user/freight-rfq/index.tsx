import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import DashboardTabs from '@/components/DashboardTabs';


const UserDash = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <UserProvider>
            <UserLayout>
                <DashboardTabs session={session} />
            </UserLayout>
        </UserProvider>
    );
};

export default UserDash;