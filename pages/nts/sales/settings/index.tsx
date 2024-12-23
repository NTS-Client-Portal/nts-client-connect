import React from 'react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import NtsSettings from '@/components/NtsSettings';
import { useSession } from '@supabase/auth-helpers-react';



const SettingsPage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <NtsSettings />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default SettingsPage;