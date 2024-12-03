import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface NtsQuoteListProps {
    session: any;
}

const NtsQuoteList: React.FC<NtsQuoteListProps> = ({ session }) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [responsePrice, setResponsePrice] = useState<string>('');
    const [responseNotes, setResponseNotes] = useState<string>('');

    useEffect(() => {
        const fetchQuotes = async () => {
            if (session?.user?.id) {
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
            }
        };

        fetchQuotes();
    }, [session, supabase]);

    const handleRespond = (quote: any) => {
        setSelectedQuote(quote);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedQuote(null);
        setResponsePrice('');
        setResponseNotes('');
    };

    const handleResponseSubmit = async () => {
        if (!selectedQuote) return;

        const { error } = await supabase
            .from('shippingquotes')
            .update({ price: parseFloat(responsePrice), notes: responseNotes })
            .eq('id', selectedQuote.id);

        if (error) {
            console.error('Error responding to quote:', error.message);
            setErrorText('Error responding to quote');
        } else {
            setQuotes(quotes.map(quote => quote.id === selectedQuote.id ? { ...quote, price: responsePrice, notes: responseNotes } : quote));
            handleModalClose();
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Assigned Quotes</h2>
            {errorText && <div className="text-red-500 mb-4">{errorText}</div>}
            <ul>
                {quotes.map((quote) => (
                    <li key={quote.id} className="mb-4">
                        <div className="p-4 bg-gray-100 rounded-lg">
                            <p><strong>Quote ID:</strong> {quote.id}</p>
                            <p><strong>Commodity:</strong> {quote.commodity}</p>
                            <p><strong>Origin:</strong> {quote.origin_city}, {quote.origin_state}</p>
                            <p><strong>Destination:</strong> {quote.destination_city}, {quote.destination_state}</p>
                            <p><strong>Price:</strong> {quote.price}</p>
                            <button
                                onClick={() => handleRespond(quote)}
                                className="text-blue-500 ml-2"
                            >
                                Respond
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Respond to Quote</h2>
                        <p><strong>Quote ID:</strong> {selectedQuote.id}</p>
                        <p><strong>Commodity:</strong> {selectedQuote.commodity}</p>
                        <p><strong>Origin:</strong> {selectedQuote.origin_city}, {selectedQuote.origin_state}</p>
                        <p><strong>Destination:</strong> {selectedQuote.destination_city}, {selectedQuote.destination_state}</p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={responsePrice}
                                onChange={(e) => setResponsePrice(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={responseNotes}
                                onChange={(e) => setResponseNotes(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleModalClose}
                                className="bg-red-500 text-white px-4 py-2 rounded-md mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResponseSubmit}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NtsQuoteList;