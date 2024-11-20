import React, { useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import DashboardTabs from '@/components/DashboardTabs';
import Documents from '@/components/Documents';
import DimensionSearch from "@/components/DimensionSearch";
import FreightInventory from '@/components/FreightInventory';
import Settings from '@/pages/user/settings';

const UserDash: React.FC = () => {
    const session = useSession();
    const [currentView, setCurrentView] = useState('freight-rfq');

    if (!session) {
        return <p>Loading...</p>;
    }

    const renderView = () => {
        switch (currentView) {
            case 'freight-rfq':
                return <DashboardTabs />;
            case 'user-documents':
                return <Documents session={session} />;
            case 'equipment-directory':
                return <DimensionSearch />;
            case 'inventory':
                return <FreightInventory session={session} />;
            case 'settings':
                return <Settings />;
            default:
                return <DashboardTabs />;
        }
    };

    return (
        <UserProvider>
            <UserLayout currentView={currentView} setCurrentView={setCurrentView}>
                {renderView()}
            </UserLayout>
        </UserProvider>
    );
};

export default UserDash;