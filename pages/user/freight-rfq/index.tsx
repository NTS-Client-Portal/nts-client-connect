import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import DashboardTabs from '@/components/DashboardTabs';
import withProfileCheck from '@/components/hoc/withProfileCheck';

const UserDash: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <UserProvider>
            <UserLayout>
                <DashboardTabs />
            </UserLayout>
        </UserProvider>
    );
};

export default withProfileCheck(UserDash);