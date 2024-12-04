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

    function archiveQuote(id: any): void {
        throw new Error('Function not implemented.');
    }

    return (
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md border border-zinc-400 max-h-max flex-grow">
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                    <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 sticky top-0">
                        <tr className='text-zinc-50 font-semibold border-b border-zinc-900 dark:border-zinc-100'>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">ID</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Origin/Destination</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Freight</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Dimensions</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Shipping Date</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Price</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800/90 divide-y divide-zinc-300">
                        {quotes.map((quote) => (
                            <tr key={quote.id}>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {quote.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    <div className="flex flex-col justify-start">
                                        <span><strong>Origin:</strong> {quote.origin_city}, {quote.origin_state} {quote.origin_zip}</span>
                                        <span><strong>Destination:</strong> {quote.destination_city}, {quote.destination_state} {quote.destination_zip}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {quote.year} {quote.make} {quote.model}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    <div className="flex flex-col gap-1 text-sm font-medium text-zinc-900 w-full max-w-max">
                                        <span className='font-semibold flex gap-1'>
                                            Length:<p className='font-normal'>{quote.length}&apos;</p>
                                            Width:<p className='font-normal'>{quote.width}&apos;</p>
                                            Height:<p className='font-normal'>{quote.height}&apos;</p></span>
                                        <span className='font-semibold flex gap-1'>Weight:<p className='font-normal'>{quote.weight} lbs</p></span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {quote.due_date ? new Date(quote.due_date).toLocaleDateString() : 'No due date'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {quote.price ? `$${quote.price}` : 'Quote Pending'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap flex items-end justify-between">
                                    <button onClick={() => archiveQuote(quote.id)} className="text-red-500 ml-2">
                                        Archive
                                    </button>
                                    <button
                                        onClick={() => handleRespond(quote)}
                                        className="body-btn"
                                    >
                                        Respond
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block 2xl:hidden">
                {quotes.map((quote) => (
                    <div key={quote.id} className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">ID</div>
                            <div className="text-sm text-zinc-900">{quote.id}</div>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Origin</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.origin_city}, {quote.origin_state} {quote.origin_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Destination</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Freight</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.year} {quote.make} {quote.model}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Dimensions</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.length}&apos; {quote.width}&apos; {quote.height}&apos; <br />{quote.weight} lbs</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Shipping Date</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.due_date ? new Date(quote.due_date).toLocaleDateString() : 'No due date'}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Price</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.price ? `$${quote.price}` : 'Quote Pending'}</div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={() => archiveQuote(quote.id)} className="text-red-500 ml-2">
                                Archive
                            </button>
                            <button
                                onClick={() => handleRespond(quote)}
                                className="ml-2 p-1 bg-blue-500 text-white rounded"
                            >
                                Respond
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Respond to Quote</h2>
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