import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import { UserProvider } from '@/context/UserContext';
import FreightRFQ from '@/pages/user/freight-rfq';
import UserDocuments from '@/pages/user/user-documents';
import EquipmentDirectory from '@/pages/user/equipment-directory';
import Inventory from '@/pages/user/inventory';
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
                return <FreightRFQ />;
            case 'user-documents':
                return <UserDocuments />;
            case 'equipment-directory':
                return <EquipmentDirectory />;
            case 'inventory':
                return <Inventory />;
            case 'settings':
                return <Settings />;
            default:
                return <FreightRFQ />;
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