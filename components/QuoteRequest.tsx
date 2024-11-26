import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteForm from './QuoteForm';
import QuoteList from './quotetabs/QuoteList';
import HistoryList from './quotetabs/HistoryList';
import OrderList from './quotetabs/OrderList';

interface QuoteRequestProps {
    session: Session | null;
}

type ShippingQuote = Database['public']['Tables']['shippingquotes']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Freight = Database['public']['Tables']['freight']['Row'];

const QuoteRequest = ({ session }: QuoteRequestProps) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
    const [freightList, setFreightList] = useState<Freight[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('requests');

    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_archived', false); // Fetch only non-archived quotes

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Quotes:', data);
            setQuotes(data);
        }
    }, [session, supabase]);

    const fetchFreight = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('freight')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Freight:', data);
            setFreightList(data);
        }
    }, [session, supabase]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchQuotes();
            fetchFreight();
        }
    }, [session, fetchQuotes, fetchFreight]);

    const addQuote = async (quote: Partial<Database['public']['Tables']['shippingquotes']['Insert']>) => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .insert([{
                ...quote,
                user_id: session.user.id,
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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

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
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    freightList={freightList}
                    addQuote={addQuote}
                    errorText={errorText}
                    setErrorText={setErrorText}
                />
            </div>
            <div className="flex border-b border-gray-300">
                <button
                    className={`px-4 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'requests' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Shipping Requests
                </button>
                <button
                    className={`px-4 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'orders' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Shipping Orders
                </button>
                <button
                    className={`px-4 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'history' ? 'bg-zinc-900 text-white border-zinc-500' : 'bg-zinc-200'}`}
                    onClick={() => setActiveTab('history')}
                >
                    Completed Orders
                </button>
            </div>
            <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                {activeTab === 'requests' && (
                    <QuoteList
                        session={session}
                        quotes={quotes}
                        fetchQuotes={fetchQuotes}
                        archiveQuote={archiveQuote}
                        transferToOrderList={transferToOrderList}
                        handleSelectQuote={string => console.log(string)}
                        isAdmin={false}
                    />
                )}
                {activeTab === 'orders' && (
                    <OrderList
                        session={session}
                        fetchQuotes={fetchQuotes}
                        archiveQuote={archiveQuote}
                        markAsComplete={handleMarkAsComplete} // Add this line
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

export default QuoteRequest;