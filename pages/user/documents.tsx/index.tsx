import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import Documents from '@/components/Documents';
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