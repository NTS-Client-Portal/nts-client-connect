import React from 'react';
import { useSession } from '@/lib/supabase/provider';
import UserTopNav from '@/pages/components/UserTopNav';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import ProfileSetup from '@/pages/components/ProfileSetup';

const ProfileSetupPage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserTopNav />
                <ProfileSetup />
        </ProfilesUserProvider>
    );
};

export default ProfileSetupPage; 