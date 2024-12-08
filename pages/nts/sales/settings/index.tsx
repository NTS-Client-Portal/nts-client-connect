import React from 'react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import Settings from '@/components/user/UserSettings';

const SettingsPage: React.FC = () => {
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <Settings />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default SettingsPage;