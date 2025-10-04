import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import UserLayout from './components/UserLayout';
import SalesLayout from '@/pages/nts/sales/_components/layout/SalesLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import Link from 'next/link';
import { Home, ArrowLeft, MapPin, Truck } from 'lucide-react';

const Custom404Content = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <div className="max-w-2xl w-full text-center">
            {/* 404 Animation */}
            <div className="relative mb-8">
                <div className="text-9xl font-bold text-blue-100 select-none">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Truck className="w-24 h-24 text-blue-600 animate-bounce" />
                </div>
            </div>

            {/* Main Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Oops! Route Not Found
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                Looks like this shipment took a wrong turn. The page you're looking for doesn't exist.
            </p>

            {/* Helpful Suggestions */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8 max-w-md mx-auto">
                <div className="flex items-start gap-3 text-left">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Lost? Here are some suggestions:</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Check the URL for typos</li>
                            <li>• Use the navigation menu to find what you need</li>
                            <li>• Return to the homepage and start fresh</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-semibold"
                >
                    <Home className="w-5 h-5" />
                    Go to Homepage
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm hover:shadow font-semibold"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>

            {/* Support Link */}
            <p className="mt-8 text-sm text-gray-500">
                Need help?{' '}
                <Link href="/support" className="text-blue-600 hover:text-blue-700 underline">
                    Contact Support
                </Link>
            </p>
        </div>
    </div>
);

const Custom404 = () => {
    const session = useSession();
    const router = useRouter();
    const isNtsRoute = router.pathname.startsWith('/nts');

    if (!session) {
        return <Custom404Content />;
    }

    if (isNtsRoute) {
        return (
            <NtsUsersProvider>
                <SalesLayout>
                    <Custom404Content />
                </SalesLayout>
            </NtsUsersProvider>
        );
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <Custom404Content />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default Custom404;
