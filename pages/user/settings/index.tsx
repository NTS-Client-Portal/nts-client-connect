import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import UserSettings from '@/components/UserSettings';
import ManagerPanel from '@/components/user/ManagerPanel';
import withManagerRole from '@/components/hoc/withManagerRole';
import withProfileCheck from '@/components/hoc/withProfileCheck';

const UserProfilePage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    const userProfile = {
        // Mock profile data, replace with actual data fetching logic
        id: session.user.id,
        email: session.user.email,
        team_role: 'manager', // or 'member'
        // Add other profile fields as needed
    };

    return (
        <UserProvider>
            <UserLayout>
                <UserSettings />
                <ManagerPanel profile={userProfile} />
            </UserLayout>
        </UserProvider>
    );
};

// Compose the HOCs
export default withProfileCheck(withManagerRole(UserProfilePage));