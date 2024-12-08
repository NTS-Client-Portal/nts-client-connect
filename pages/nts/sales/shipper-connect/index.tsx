import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import DashboardTabs from '@/components/nts/DashboardTabs';

const ShipperConnect: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <DashboardTabs />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default ShipperConnect;