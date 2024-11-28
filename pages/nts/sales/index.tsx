import React, { useState } from 'react';
import SalesLayout from './_components/layout/SalesLayout';
import SalesDashboard from './_components/SalesDashboard';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { UserProvider } from '@/context/UserContext';
import Documents from '@/components/Documents';
import DimensionSearch from '@/components/DimensionSearch';
import Settings from '@/components/user/UserSettings';
import SalesSideNav from './_components/layout/SalesSideNav';

const SalesDashboardPage = () => {
    const session = useSession();
    const [currentView, setCurrentView] = useState('analytics');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!session) {
        return <p>Loading...</p>; // or redirect to login page
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const renderView = () => {
        switch (currentView) {
            case 'salesdash':
                return <SalesDashboard session={session} />;
            case 'documents':
                return <Documents session={session}/>;
            case 'equipment-directory':
                return <DimensionSearch />;
            case 'settings':
                return <Settings />;
            default:
                return <SalesDashboard session={session} />;
        }
    };

    return (
        <UserProvider>
            <SalesLayout currentView={currentView} setCurrentView={setCurrentView}>
                {renderView()}
            </SalesLayout>
        </UserProvider>
    );
};

export default SalesDashboardPage;