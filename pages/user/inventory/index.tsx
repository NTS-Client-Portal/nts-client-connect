import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import UserLayout from '../../components/UserLayout';
import FreightInventory from '@/components/FreightInventory';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const FreightInventoryPage: React.FC = () => {
    const { session, isLoading } = useSessionContext();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'freight' | 'lanes'>('freight');

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
                <FreightInventory session={session} />    
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default FreightInventoryPage;
