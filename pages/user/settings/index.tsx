import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import UserSettings from '@/components/user/UserSettings';

const UserProfilePage: React.FC = () => {
    const { session, isLoading } = useSessionContext();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('settings');

    useEffect(() => {
        if (!isLoading && !session) {
            router.replace('/');
        }
    }, [isLoading, session, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
            </div>
        );
    }

    if (!session) {
        return null; // Redirecting to login
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
