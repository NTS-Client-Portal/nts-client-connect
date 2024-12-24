import react, { useState, useEffect } from 'react';
import { supabase } from '@lib/initSupabase';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@lib/database.types';
import Link from 'next/link';

interface ShipperDashProps {
    session: Session | null;
}

const ShipperDash: React.FC<ShipperDashProps> = ({ session }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [analytics, setAnalytics] = useState<Database| null>(null);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [quoteIds, setQuoteIds] = useState<string[]>([]);
    const [selectedQuote, setSelectedQuote] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);

    useEffect(() => {
        const fetchQuotesAnalytics = async () => {
            const { data: analyticsData, error: analyticsError } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('user_id', session?.user.id)
                .neq('status', 'Quotes');

            if (analyticsError) {
                console.error('Error fetching analytics:', analyticsError.message);
                setErrorText('Error fetching analytics');
            } else {
                setAnalytics(analyticsData as any as Database);
            }

            setIsLoading(false);
        };

        if (session) {
            fetchQuotesAnalytics();
        } else {
            setIsLoading(false);
        }
    }, [session]);

    const fetchOrdersCompleted = async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('id')
            .eq('user_id', session?.user.id)
            .eq('is_completed', true);

        if (error) {
            console.error('Error fetching completed orders:', error.message);
            setErrorText('Error fetching completed orders');
            return;
        }

        setQuoteIds(data.map((quote: any) => quote.id));
    }

    const fetchPricedQuotes = async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session?.user.id)
            .eq('price', Number);

        if (error) {
            console.error('Error fetching priced quotes:', error.message);
            setErrorText('Error fetching priced quotes');
            return;
        }

        setQuotes(data);
    }

    useEffect(() => {
        const fetchPricedQuotes = async () => {
            const { data, error } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('user_id', session?.user.id)
                .gt('price', 0);

            if (error) {
                console.error('Error fetching priced quotes:', error.message);
                setErrorText('Error fetching priced quotes');
                return;
            }

            setQuotes(data);
        };

        if (session) {
            fetchPricedQuotes();
        }
    }, [session]);


    return (
        <div className='container mx-auto flex gap-6 justify-center w-full'>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="p-4 bg-white shadow rounded-lg max-w-lg max-h-96 overflow-auto">
                    <h2 className="text-xl font-bold mb-4">Quotes Analytics</h2>
                    {errorText ? (
                        <p className="text-red-500">{errorText}</p>
                    ) : (
                        <div>
                            {analytics ? (
                                <div>
                                    <h3 className="text-lg font-semibold">Active Quotes</h3>
                                    <div>
                                        <ul className='flex gap-2 flex-wrap'>
                                            {quotes.map((quote) => (
                                                <li key={quote.id} className="mb-2">
                                                    <p>ID: {quote.id}</p>
                                                    <p>Status: {quote.status}</p>
                                                    <p>Commodity: {quote.make && quote.model ? ( `${quote.make} ${quote.model}`
                                                        ) : quote.container_type ? (  `${quote.container_length} ${quote.container_type}` ) : ( "N/A" )}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <Link className="body-btn" href={`/user`}>
                                Create Shipping Quote
                             </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
                {quotes.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-100 shadow rounded-lg max-w-fit max-h-96 overflow-auto">
                        <h3 className="text-lg font-semibold mb-2">Quotes with Price</h3>
                        { setQuotes ? (
                        <ul className='flex gap-2 flex-wrap'>
                            {quotes.filter(quote => quote.price !== null && quote.price > 0).map((quote) => (
                                <li key={quote.id} className="mb-2">
                                    <p>ID: {quote.id}</p>
                                    <p>Price: ${quote.price}</p>
                                    <p>Status: {quote.status}</p>
                                    <p>Commodity: {quote.make && quote.model ? ( `${quote.make} ${quote.model}`
                                    ) : quote.container_type ? (  `${quote.container_length} ${quote.container_type}` ) : ( "N/A" )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Link className="body-btn" href={`/user`}>
                           View Status
                        </Link>
                    )}
                    </div>
                    
                )}
            

        
        </div>
    );
}

export default ShipperDash;