import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '../../components/UserLayout';
import FreightInventory from '@/components/FreightInventory';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const FreightInventoryPage: React.FC = () => {
    const session = useSession();
    const [activeTab, setActiveTab] = useState<'freight' | 'lanes'>('freight');

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

export default FreightInventoryPage;