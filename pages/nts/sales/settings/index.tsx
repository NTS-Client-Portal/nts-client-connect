import React from 'react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import NtsSettings from '@/components/NtsSettings';
import { useSession } from '@supabase/auth-helpers-react';
import withNtsUser from '@/components/hoc/withNtsUser';

const SettingsPage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <NtsSettings session={session} />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default withNtsUser(SettingsPage);