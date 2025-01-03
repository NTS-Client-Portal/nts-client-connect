import React from 'react';
import { useSession, Session } from '@supabase/auth-helpers-react';
import SalesLayout from './_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import Crm from '../components/Crm';
import withNtsUser from '@/components/hoc/withNtsUser';

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

export default withNtsUser(ShipperConnect);