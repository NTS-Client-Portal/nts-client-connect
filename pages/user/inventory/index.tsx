import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import FreightInventory from '@/components/FreightInventory';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const InventoryPage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <FreightInventory session={session} />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default InventoryPage;