import React from 'react';
import DimensionSearch from '@/components/DimensionSearch';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const EquipmentDirectoryPage: React.FC = () => {
    return (
        <ProfilesUserProvider>
            <UserLayout>
                <DimensionSearch />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default EquipmentDirectoryPage;