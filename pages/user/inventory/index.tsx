import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import UserLayout from '../../components/UserLayout';
import FreightInventory from '@/components/FreightInventory';
import LanesInventory from '@/components/LanesInventory';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import withProfileCheck from '@/components/hoc/withProfileCheck';

const FreightInventoryPage: React.FC = () => {
    const session = useSession();
    const [activeTab, setActiveTab] = useState<'freight' | 'lanes'>('freight');

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <ProfilesUserProvider>
            <UserLayout>
                <div className="flex gap-1 border-b border-gray-300">
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'freight' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('freight')}
                    >
                        Freight Inventory
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'lanes' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('lanes')}
                    >
                        Lanes Inventory
                    </button>
                </div>
                <div className='flex flex-col gap-8'>
                    {activeTab === 'freight' && <FreightInventory session={session} />}
                    {activeTab === 'lanes' && <LanesInventory session={session} />}
                </div>
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default FreightInventoryPage;