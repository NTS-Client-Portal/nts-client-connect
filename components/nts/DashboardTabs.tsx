import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import NtsQuoteList from '@/components/nts/NtsQuoteList';
import NtsOrderList from './NtsOrderList';
import DeliveredTab from './DeliveredTab';
import ArchivedTab from './ArchivedTab';
import { MoveHorizontal } from 'lucide-react';

interface DashboardTabsProps {
    companyId: string;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ companyId }) => {
    const session = useSession();
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [orders, setOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [activeTab, setActiveTab] = useState('requests');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [companyName, setCompanyName] = useState<string>('');

    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        

        // Fetch the companies assigned to the sales user
        const { data: companies, error: companiesError } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .eq('sales_user_id', session.user.id);

        if (companiesError) {
            console.error('Error fetching companies:', companiesError.message);
            setErrorText('Error fetching companies');
            return;
        }

        

        if (companies && companies.length > 0) {
            const companyIds = companies.map(company => company.company_id);
            console.log('Company IDs:', companyIds); // Log company IDs for debugging

            // Fetch the quotes for the companies assigned to the sales user
            const { data: quotesData, error: quotesError } = await supabase
                .from('shippingquotes')
                .select('*')
                .in('company_id', companyIds);

            if (quotesError) {
                console.error('Error fetching quotes:', quotesError.message);
                setErrorText('Error fetching quotes');
            } else {
                console.log('Fetched Quotes:', quotesData); // Log fetched quotes for debugging
                setQuotes(quotesData);
            }
        } else {
            console.log('No companies assigned to the sales user');
            setQuotes([]);
        }
    }, [session, supabase]);

    useEffect(() => {
    const fetchCompanyName = async () => {
        const { data: company, error } = await supabase
            .from('companies')
            .select('company_name')
            .eq('id', companyId)
            .single();

        if (error) {
            console.error('Error fetching company name:', error.message);
        } else {
            setCompanyName(company.company_name);
        }
    };

    fetchCompanyName();
}, [companyId, supabase]);

    const fetchOrders = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('assigned_sales_user', session.user.id);

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Orders:', data);
            setOrders(data);
        }
    }, [session, supabase]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchQuotes();
            fetchOrders();
        }
    }, [session, fetchQuotes, fetchOrders]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const archiveQuote = async (id: number) => {
        if (!session?.user?.id) return;

        const { error } = await supabase
            .from('shippingquotes')
            .update({ is_archived: true } as Database['public']['Tables']['shippingquotes']['Update']) // Mark the quote as archived
            .eq('id', id);

        if (error) {
            console.error('Error archiving quote:', error.message);
            setErrorText('Error archiving quote');
        } else {
            setQuotes(quotes.filter(quote => quote.id !== id));
        }
    };

    const transferToOrderList = async (quoteId: number) => {
        if (!session?.user?.id) {
            setErrorText('User is not authenticated');
            return;
        }

        try {
            // Logic to transfer the quote to the order list
            const { data, error } = await supabase
                .from('orders')
                .insert([{ quote_id: quoteId, user_id: session.user.id }]);

            if (error) {
                console.error('Error transferring quote to order list:', error);
                setErrorText('Error transferring quote to order list');
            } else {
                console.log('Quote transferred to order list:', data);
                // Remove the transferred quote from the quotes array
                setQuotes(quotes.filter(quote => quote.id !== quoteId));
            }
        } catch (error) {
            console.error('Error transferring quote to order list:', error);
            setErrorText('Error transferring quote to order list');
        }
    };

    const handleMarkAsComplete = async (orderId: number): Promise<void> => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'delivered' })
                .eq('id', orderId);

            if (error) {
                console.error('Error marking order as complete:', error.message);
                setErrorText('Error marking order as complete');
            } else {
                setOrders(orders.filter(order => order.id !== orderId));
            }
        } catch (error) {
            console.error('Error marking order as complete:', error);
            setErrorText('Error marking order as complete');
        }
    };

    return (
        <div className="w-full h-full overflow-auto">
            <div className="w-full">
                <div className='flex flex-col justify-start items-center gap-2 mb-4'>
                    <span className='flex mt-5 lg:mt-2 2xl:mt-0 items-center justify-center font-bold  flex-nowrap'> <h2 className='text-lg md:mt-0  self-center font-extrabold tracking-tighter text-zinc-900 flex gap-0.5'>SHIPPER<MoveHorizontal className='size-6 text-orange-500' />CONNECT</h2></span>
                    
                </div>
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
                        <option value="delivered">Delivered</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            ) : (
                <div className="flex gap-1 border-b border-gray-300">
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'requests' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Shipping Requests
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'orders' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Shipping Orders
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'delivered' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('delivered')}
                    >
                        Delivered
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'archived' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                        onClick={() => setActiveTab('archived')}
                    >
                        Archived
                    </button>
                </div>
            )}
            <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                {activeTab === 'requests' && (
                    <NtsQuoteList
                        session={session}
                    />
                )}
                {activeTab === 'orders' && (
                    <NtsOrderList
                        session={session}
                        fetchQuotes={fetchQuotes}
                        archiveQuote={archiveQuote}
                        markAsComplete={handleMarkAsComplete}
                    />
                )}
                {activeTab === 'delivered' && (
                    <DeliveredTab
                        session={session}
                    />
                )}
                {activeTab === 'archived' && (
                    <ArchivedTab
                        session={session}
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardTabs;