import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import FreightInventory from '@/components/FreightInventory';
import QuoteRequest from '@/components/QuoteRequest';

const DashboardTabs = () => {
    const session = useSession();
    const [activeTab, setActiveTab] = useState('Freight Inventory');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Freight Inventory':
                return <FreightInventory session={session} />;
            case 'Logistics RFQ':
                return <QuoteRequest session={session} />;
            default:
                return null;
        }
    };

    return (
        
            <div className="flex flex-col items-start justify-center w-full h-full">
                <div className="tabs flex space-x-4 border-b-2 border-zinc-300 dark:border-zinc-900">
                    {['Freight Inventory', 'Logistics RFQ'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 bg-zinc-50 dark:bg-zinc-600 dark:border-zinc-900 py-2 rounded-t-lg ${activeTab === tab ? 'bg-zinc-50 dark:bg-zinc-800 border-l border-t border-r border-zinc-300 dark:border-zinc-900' : 'bg-zinc-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="tab-content p-4 border border-zinc-300 dark:border-zinc-900 bg-white dark:bg-zinc-600 w-full">
                    {renderTabContent()}
                </div>
            </div>
    );
};

export default DashboardTabs;