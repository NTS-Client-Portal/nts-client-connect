import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import Documents from '@/components/Documents';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import withProfileCheck from '@/components/hoc/withProfileCheck';

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

export default withProfileCheck(UserDocumentsPage);