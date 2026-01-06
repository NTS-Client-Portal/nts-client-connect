import React from 'react';
import { useSession } from '@/lib/supabase/provider';
import SalesLayout from '@/pages/nts/sales/_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import Crm from '../../components/Crm';

const SalesDashboardPage: React.FC = () => {
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

export default SalesDashboardPage;