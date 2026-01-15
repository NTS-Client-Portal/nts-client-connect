import React from 'react';
import { useSession } from '@/lib/supabase/provider';
import Documents from '@/components/user/Documents';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const UserDocumentsPage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <Documents session={session} />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default UserDocumentsPage;