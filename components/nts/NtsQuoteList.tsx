import React, { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteTableRow from '../user/quotetabs/QuoteTableRow'; // Import QuoteTableRow component
import EditQuoteModal from '../user/quotetabs/EditQuoteModal'; // Import EditQuoteModal component
import EditHistory from '../EditHistory'; // Import EditHistory component

interface NtsQuoteListProps {
    session: any;
    fetchQuotes: () => void;
    archiveQuote: (id: number) => Promise<void>;
    transferToOrderList: (quoteId: number, data: any) => Promise<void>;
    handleSelectQuote: (id: number) => void;
    isAdmin: boolean;
}

// Removed duplicate interface definition

const NtsQuoteList: React.FC<NtsQuoteListProps> = ({ session, fetchQuotes, transferToOrderList, handleSelectQuote }) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [selectedQuote, setSelectedQuote] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [responsePrice, setResponsePrice] = useState<string>('');
    const [responseNotes, setResponseNotes] = useState<string>('');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [editHistory, setEditHistory] = useState<Database['public']['Tables']['edit_history']['Row'][]>([]);
    const [sortedQuotes, setSortedQuotes] = useState(quotes);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'desc' });
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10; 

        const fetchEditHistory = useCallback(async (companyId: string) => {
        const { data, error } = await supabase
            .from('edit_history')
            .select('*')
            .eq('company_id', companyId)
            .order('edited_at', { ascending: false });

        if (error) {
            console.error('Error fetching edit history:', error.message);
        } else {
            console.log('Fetched Edit History:', data);
            setEditHistory(data);
        }
    }, [supabase]);

    const handleEditClick = (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        setQuoteToEdit(quote);
        setIsEditModalOpen(true);
    };

    useEffect(() => {
        const fetchQuotes = async () => {
            if (session?.user?.id) {
                // Fetch the companies assigned to the nts user
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

                    // Fetch the quotes for the companies assigned to the nts user
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
                    console.log('No companies assigned to the nts user');
                    setQuotes([]);
                }
            }
        };

        fetchQuotes();
    }, [session, supabase]);

    useEffect(() => {
        const sorted = [...quotes].sort((a, b) => {
            if (a[sortConfig.column] < b[sortConfig.column]) {
                return sortConfig.order === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.column] > b[sortConfig.column]) {
                return sortConfig.order === 'asc' ? 1 : -1;
            }
            return 0;
        });

        setSortedQuotes(sorted);
    }, [quotes, sortConfig]);

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

    const handleRespond = (quoteId: number) => {
        const quote = quotes.find(q => q.id === quoteId);
        if (quote) {
            setSelectedQuote(quote);
            setIsModalOpen(true);
        }
    };

    const handleCreateOrderClick = (quoteId: number) => {
        setSelectedQuoteId(quoteId);
        setIsModalOpen(true);
    };

    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);


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
            setQuotes(quotes.map(quote => quote.id === selectedQuote.id ? { ...quote, price: parseFloat(responsePrice), notes: responseNotes } : quote));
            handleModalClose();
        }
    };

    const handleRowClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };


    const duplicateQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                due_date: null, // Require the user to fill out a new shipping date
            })
            .select();

        if (error) {
            console.error('Error duplicating quote:', error.message);
        } else {
            if (data && data.length > 0) {
                setPopupMessage(`Duplicate Quote Request Added - Quote #${data[0].id}`);
            }
            fetchQuotes();
        }
    };

    const reverseQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                due_date: null, // Require the user to fill out a new shipping date
                origin_city: quote.destination_city,
                origin_state: quote.destination_state,
                origin_zip: quote.destination_zip,
                destination_city: quote.origin_city,
                destination_state: quote.origin_state,
                destination_zip: quote.origin_zip,
            })
            .select();

        if (error) {
            console.error('Error reversing quote:', error.message);
        } else {
            if (data && data.length > 0) {
                setPopupMessage(`Flip Route Duplicate Request Added - Quote #${data[0].id}`);
            }
            fetchQuotes();
        }
    };

    useEffect(() => {
        if (popupMessage) {
            const timer = setTimeout(() => {
                setPopupMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [popupMessage]);

    // Calculate the rows to display based on the current page
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = sortedQuotes.slice(indexOfFirstRow, indexOfLastRow);

    // Calculate total pages
    const totalPages = Math.ceil(sortedQuotes.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

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
                    {currentRows.map((quote, index) => (
                                <QuoteTableRow
                                    key={quote.id}
                                    quote={quote}
                                    expandedRow={expandedRow}
                                    handleRowClick={handleRowClick}
                                    handleRespond={(quoteId) => handleRespond(quoteId)}
                                    handleEditClick={handleEditClick}
                                    handleCreateOrderClick={handleCreateOrderClick}
                                    isAdmin={isAdmin}
                                    rowIndex={index} // Pass row index to QuoteTableRow
                                    duplicateQuote={duplicateQuote} // Pass duplicateQuote function to QuoteTableRow
                                    reverseQuote={reverseQuote} // Pass reverseQuote function to QuoteTableRow
                                    archiveQuote={archiveQuote}
                                />
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
                            <button
                                onClick={() => handleRespond(quote.id)}
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