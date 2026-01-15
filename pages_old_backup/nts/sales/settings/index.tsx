import React from 'react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import NtsSettings from '@/components/NtsSettings';
import { useSession } from '@/lib/supabase/provider';

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

export default SettingsPage;