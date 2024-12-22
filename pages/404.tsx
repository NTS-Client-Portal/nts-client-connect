import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import UserLayout from './components/UserLayout';
import SalesLayout from '@/pages/nts/sales/_components/layout/SalesLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import Link from 'next/link';

const Custom404 = () => {
    const session = useSession();
    const router = useRouter();
    const isNtsRoute = router.pathname.startsWith('/nts');

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <h1 className="text-3xl font-bold text-red-500 mb-4">404 - You shouldn&apos;t be here</h1>
                <Link className="text-blue-500 underline" href="/">
                    Go to Home Page
                </Link>
            </div>
        );
    }

    if (isNtsRoute) {
        return (
            <NtsUsersProvider>
                <SalesLayout>
                    <div className="min-h-screen flex items-center justify-center bg-gray-100">
                        <h1 className="text-3xl font-bold text-red-500">404 - You shouldn&apos;t be here</h1>
                    </div>
                </SalesLayout>
            </NtsUsersProvider>
        );
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <h1 className="text-3xl font-bold text-red-500">404 - You shouldn&apos;t be here</h1>
                </div>
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default Custom404;