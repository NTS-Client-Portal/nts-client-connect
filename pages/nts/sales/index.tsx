import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import SalesLayout from './_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import DashboardTabs from '@/components/nts/DashboardTabs';
import Crm from '../components/Crm';

const ShipperConnect: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <Crm />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default ShipperConnect;