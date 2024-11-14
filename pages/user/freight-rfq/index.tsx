import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import FreightInventory from '@/components/FreightInventory';
import QuoteRequest from '@/components/QuoteRequest';
import ChromeQuoteRequest from '@/components/ChromeQuoteRequest';
import UserLayout from '@/pages/components/UserLayout';

const DashboardTabs = () => {
    const session = useSession();
    const [activeTab, setActiveTab] = useState('Freight Inventory');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Freight Inventory':
                return <FreightInventory session={session} />;
            case 'Admin Quote Requests':
                return <QuoteRequest session={session} />;
            case 'Chrome Quote Request':
                return <ChromeQuoteRequest session={session} />;
            default:
                return null;
        }
    };

    return (
        <UserLayout>
            <div className="flex flex-col items-start justify-center w-full h-full">
                <div className="tabs flex space-x-4 border-b-2 border-zinc-300">
                    {['Freight Inventory', 'Admin Quote Requests', 'Chrome Quote Request'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-t-lg ${activeTab === tab ? 'bg-white border-l border-t border-r border-zinc-300' : 'bg-zinc-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="tab-content p-4 border-l border-r border-b border-zinc-300 bg-white w-full">
                    {renderTabContent()}
                </div>
            </div>
        </UserLayout>
    );
};

export default DashboardTabs;