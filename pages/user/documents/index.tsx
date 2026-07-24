import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import Documents from '@/components/user/Documents';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const UserDocumentsPage: React.FC = () => {
    const { session, isLoading } = useSessionContext();
    const router = useRouter();

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
                <Documents session={session} />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default UserDocumentsPage;
