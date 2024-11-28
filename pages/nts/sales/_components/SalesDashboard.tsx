import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteForm from '@/components/user/QuoteForm';
import QuoteList from '@/components/user/quotetabs/QuoteList';
import HistoryList from '@/components/user/quotetabs/HistoryList';
import OrderList from '@/components/user/quotetabs/OrderList';

interface SalesDashboardProps {
    session: Session | null;
}

type ShippingQuote = Database['public']['Tables']['shippingquotes']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Freight = Database['public']['Tables']['freight']['Row'];
type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const SalesDashboard = ({ session }: SalesDashboardProps) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [freightList, setFreightList] = useState<Freight[]>([]);
    const [history, setHistory] = useState<Order[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('requests');
    const [userRole, setUserRole] = useState<string | null>(null);

    const user = session?.user;

    const fetchUserRole = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('nts_users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) {
            setErrorText(error.message);
        } else {
            setUserRole(data?.role || null);
        }
    }, [user, supabase]);

    const fetchQuotes = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('assigned_sales_user', user.id)
            .eq('is_archived', false); // Fetch only non-archived quotes

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Quotes:', data);
            setQuotes(data);
        }
    }, [user, supabase]);

    const fetchOrders = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('assigned_sales_user', user.id);

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Orders:', data);
            setOrders(data);
        }
    }, [user, supabase]);

    const fetchHistory = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'delivered')
            .eq('assigned_sales_user', user.id);

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched History:', data);
            setHistory(data);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (user) {
            fetchUserRole();
            fetchQuotes();
            fetchOrders();
            fetchHistory();
        }
    }, [user, fetchUserRole, fetchQuotes, fetchOrders, fetchHistory]);

    const addQuote = async (quote: Partial<Database['public']['Tables']['shippingquotes']['Insert']>) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .insert([{
                ...quote,
                user_id: user.id,
                first_name: quote.first_name || null,
                last_name: quote.last_name || null,
                email: quote.email || null,
                inserted_at: quote.inserted_at || new Date().toISOString(),
                is_complete: quote.is_complete || false,
                is_archived: quote.is_archived || false,
            }])
            .select();

        if (error) {
            console.error('Error adding quote:', error.message);
            setErrorText('Error adding quote');
        } else {
            console.log('Quote added successfully:', data);
            setQuotes([...quotes, ...(data || [])]);
            setErrorText('');
            setIsModalOpen(false); // Close the modal after adding the quote
        }
    };

    const archiveQuote = async (id: number) => {
        if (!user) return;

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
        if (!user) {
            setErrorText('User is not authenticated');
            return;
        }

        try {
            // Logic to transfer the quote to the order list
            const { data, error } = await supabase
                .from('orders')
                .insert([{ quote_id: quoteId, user_id: user.id }]);

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

    const canEdit = userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin';

    return (
        <div className="w-full h-full overflow-auto">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center gap-2'>
                    <h1 className="xs:text-md mb-2 text-xl md:text-2xl font-medium text-center underline underline-offset-8">Request a Shipping Quote</h1>
                    {canEdit && (
                        <button onClick={() => setIsModalOpen(true)} className="body-btn">
                            Request a Shipping Estimate
                        </button>
                    )}
                </div>
                <QuoteForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    freightList={freightList}
                    addQuote={addQuote}
                    errorText={errorText}
                    setErrorText={setErrorText}
                />
            </div>
            <div className="flex justify-center items-center border-b border-zinc-300">
                <button
                    className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-600' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Shipping Requests
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'orders' ? 'border-b-2 border-amber-500' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Shipping Orders
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-green-500' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Completed Orders
                </button>
            </div>
            <div className="w-full bg-white shadow overflow-hidden rounded-md border border-zinc-400 flex-grow">
                {activeTab === 'requests' && (
                    <QuoteList
                        session={session}
                        quotes={quotes}
                        fetchQuotes={fetchQuotes}
                        archiveQuote={canEdit ? archiveQuote : undefined}
                        transferToOrderList={canEdit ? transferToOrderList : undefined}
                        handleSelectQuote={string => console.log(string)}
                        isAdmin={canEdit}
                    />
                )}
                {activeTab === 'orders' && (
                    <OrderList
                        session={session}
                        fetchQuotes={fetchQuotes}
                        archiveQuote={canEdit ? archiveQuote : undefined}
                        markAsComplete={canEdit ? handleMarkAsComplete : undefined}
                    />
                )}
                {activeTab === 'history' && (
                    <HistoryList
                        session={session}
                    />
                )}
            </div>
        </div>
    );
};

export default SalesDashboard;