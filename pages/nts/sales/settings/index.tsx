import React from 'react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import Settings from '@/components/user/UserSettings';
import { useSession } from '@supabase/auth-helpers-react';

const session = useSession();

const SettingsPage: React.FC = () => {
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <Settings session={session} />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default SettingsPage;