import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import ShipperDash from '@/components/user/ShipperDash';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const ShipperDashboard: React.FC = () => {
    const { session, isLoading } = useSessionContext();
    const router = useRouter();

    // Once auth has finished loading, if there is no session send the user to
    // the login page instead of leaving them stuck on a "Loading..." screen.
    useEffect(() => {
        if (!isLoading && !session) {
            router.replace('/');
        }
    }, [isLoading, session, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
        );
    }

    if (!session) {
        return null; // Redirecting to login
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <ShipperDash />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default ShipperDashboard;
