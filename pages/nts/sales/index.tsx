import React, { useState } from 'react';
import SalesLayout from './_components/layout/SalesLayout';
import DashboardTabs from '@components/nts/DashboardTabs';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { UserProvider } from '@/context/UserContext';
import Documents from '@/components/Documents';
import DimensionSearch from '@/components/DimensionSearch';
import Settings from '@/components/user/UserSettings';
import SalesSideNav from './_components/layout/SalesSideNav';
import Crm from '../components/Crm';

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
            case 'crm':
                return <Crm />;
            case 'salesdash':
                return <DashboardTabs />;
            case 'documents':
                return <Documents session={session}/>;
            case 'equipment-directory':
                return <DimensionSearch />;
            case 'settings':
                return <Settings />;
            default:
                return <Crm />;
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