import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import UserSettings from '@/components/UserSettings';
import ManagerPanel from '@/components/user/ManagerPanel';
import withManagerRole from '@/components/hoc/withManagerRole';
import withProfileCheck from '@/components/hoc/withProfileCheck';

const UserProfilePage: React.FC = () => {
    const session = useSession();
    const [activeTab, setActiveTab] = useState('settings');

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
            <UserLayout currentView={activeTab} setCurrentView={setActiveTab}>
                <div className="flex flex-col w-full">
                    <div className="flex border-b border-gray-300">

                        <button
                            className={`px-4 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'settings' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            User&apos;s Settings
                        </button>
                        <button
                            className={`px-4 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'manager' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                            onClick={() => setActiveTab('manager')}
                        >
                            Manager&apos;s Panel
                        </button>

                    </div>
                    <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                        {activeTab === 'settings' && <UserSettings />}
                        {activeTab === 'manager' && <ManagerPanel profile={userProfile} />}
                    </div>
                </div>
            </UserLayout>
        </UserProvider>
    );
};

// Compose the HOCs
export default withProfileCheck(withManagerRole(UserProfilePage));