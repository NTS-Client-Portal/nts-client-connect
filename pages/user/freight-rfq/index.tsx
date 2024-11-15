import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import DashboardTabs from '@/components/DashboardTabs';


const UserDash = () => {


    return (
        <UserProvider>
            <UserLayout>
                <DashboardTabs />
            </UserLayout>
        </UserProvider>
    );
};

export default UserDash;