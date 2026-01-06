import React from 'react';
import { useSession } from '@/lib/supabase/provider';
import { Session } from '@supabase/supabase-js';
import SalesLayout from './_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
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