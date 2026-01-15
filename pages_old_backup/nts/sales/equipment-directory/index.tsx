import React from 'react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import DimensionSearch from '@/components/DimensionSearch';
import withNtsUser from '@/components/hoc/withNtsUser';

const EquipmentDirectoryPage: React.FC = () => {
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <DimensionSearch />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default EquipmentDirectoryPage;