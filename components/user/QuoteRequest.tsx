import React, { useState, useEffect } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteForm from './QuoteForm';
import QuoteList from './quotetabs/QuoteList';
import HistoryList from './quotetabs/HistoryList';
import OrderList from './quotetabs/OrderList';
import Archived from './quotetabs/Archived';
import Rejected from './quotetabs/Rejected';
import EditHistory from '../EditHistory'; // Adjust the import path as needed

interface QuoteRequestProps {
    session: Session | null;
    profiles: any[];
    ntsUsers: any[];
    isAdmin: boolean;
}

const QuoteRequest: React.FC<QuoteRequestProps> = ({ session, profiles, ntsUsers, isAdmin }: QuoteRequestProps) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('requests');
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="w-full h-full overflow-auto">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center gap-2 mb-4'>
                    <h1 className="xs:text-md mb-2 text-xl md:text-2xl font-medium text-center underline underline-offset-8">Request a Shipping Quote</h1>
                    <button onClick={() => setIsModalOpen(true)} className="body-btn">
                        Request a Shipping Estimate
                    </button>
                </div>
                <QuoteForm
                    session={session}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    addQuote={() => { }} // Pass an empty function or handle it in QuoteForm
                    errorText=""
                    setErrorText={() => { }} // Pass an empty function or handle it in QuoteForm
                    fetchQuotes={() => { }} // Pass an empty function or handle it in QuoteForm
                    companyId={null} // Pass null or handle it in QuoteForm
                />
            </div>
            {isMobile ? (
                <div className="relative">
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                    >
                        <option value="requests">Shipping Requests</option>
                        <option value="orders">Shipping Orders</option>
                        <option value="history">Completed Orders</option>
                        <option value="archived">Archived</option>
                        <option value="rejected">Rejected RFQ&apos;s</option>
                        <option value="editHistory">Edit History</option>
                    </select>
                </div>
            ) : (
                <div className="flex gap-1 border-b border-gray-300">
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'requests' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Shipping Requests
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'orders' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Shipping Orders
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'history' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Completed Orders
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'archived' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('archived')}
                    >
                        Archived
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'rejected' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('rejected')}
                    >
                        Rejected RFQ&apos;
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'editHistory' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('editHistory')}
                    >
                        Edit History
                    </button>
                </div>
            )}
            <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                {activeTab === 'requests' && (
                    <QuoteList
                        session={session}
                        isAdmin={isAdmin} // Pass isAdmin state
                    />
                )}
                {activeTab === 'orders' && (
                    <OrderList
                        session={session}
                        isAdmin={isAdmin}
                        fetchQuotes={() => { }}
                        markAsComplete={null}
                    />
                )}
                {activeTab === 'history' && (
                    <HistoryList
                        session={session}
                    />
                )}
                {activeTab === 'archived' && (
                    <Archived
                        session={session}
                    />
                )}
                {activeTab === 'rejected' && (
                    <Rejected
                        session={session}
                    />
                )}
                {activeTab === 'editHistory' && (
                    <EditHistory
                        editHistory={[]} // Pass an empty array or handle it in EditHistory
                        quoteId={0} // Pass a dummy quoteId since it's not used in this context
                        searchTerm=""
                        searchColumn="id"
                    />
                )}
            </div>
        </div>
    );
};

export default QuoteRequest;