import React, { useState } from 'react';
import { useSession } from '@/lib/supabase/provider';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import UserSettings from '@/components/user/UserSettings';

const UserProfilePage: React.FC = () => {
    const session = useSession();
    const [activeTab, setActiveTab] = useState('settings');

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <div className="flex flex-col w-full">
                    <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                        <UserSettings session={session} />
                    </div>
                </div>
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default UserProfilePage;