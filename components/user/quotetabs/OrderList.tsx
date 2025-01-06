import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import Modal from '@/components/ui/Modal';
import OrderTable from './OrderTable';
import { generatePDF, uploadPDFToSupabase, insertDocumentRecord } from '@/components/GeneratePDF';
import { useRouter } from 'next/router';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface OrderListProps {
    session: Session | null;
    selectedUserId: string;
    fetchQuotes: () => void;
    isAdmin: boolean;
}

const OrderList: React.FC<OrderListProps> = ({ session, isAdmin }) => {
    const [quotes, setQuotes] = useState<ShippingQuotesRow[]>([]);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: 'asc' | 'desc' }>({ column: '', order: 'asc' });
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [sortedQuotes, setSortedQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [cancellationReason, setCancellationReason] = useState<string>('');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editData, setEditData] = useState<Partial<ShippingQuotesRow>>({});
    const [isNtsUser, setIsNtsUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchColumn, setSearchColumn] = useState<string>('id');
    const router = useRouter();

    const fetchOrdersForNtsUsers = useCallback(async (userId: string) => {
        const { data: companySalesUsers, error: companySalesUsersError } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .eq('sales_user_id', userId);

        if (companySalesUsersError) {
            console.error('Error fetching company_sales_users for nts_user:', companySalesUsersError.message);
            return [];
        }

        const companyIds = companySalesUsers.map((companySalesUser) => companySalesUser.company_id);

        const { data: quotes, error: quotesError } = await supabase
            .from('shippingquotes')
            .select('*')
            .in('company_id', companyIds)
            .eq('status', 'Order')
            .not('is_complete', 'is', true);

        if (quotesError) {
            console.error('Error fetching quotes for nts_user:', quotesError.message);
            return [];
        }

        return quotes;
    }, []);

    const fetchQuotesForCompany = useCallback(async (companyId: string) => {
        const { data: quotes, error: quotesError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'Order')
            .not('is_complete', 'is', true);

        if (quotesError) {
            console.error('Error fetching quotes for company:', quotesError.message);
            return [];
        }

        return quotes;
    }, []);

    const fetchQuotes = useCallback(async () => {
        let query = supabase
            .from('shippingquotes')
            .select('*')
            .eq('status', 'Order')
            .or('is_archived.is.null,is_archived.eq.false')
            .not('is_complete', 'eq', true)
            .or('is_complete.is.null,is_complete.eq.true');


        if (!isNtsUser && session?.user?.id) {
            query = query.eq('user_id', session.user.id);
        }

        const { data, error } = await query;

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Quotes:', data);
            setQuotes(data as any); // Ensure the data is cast to the correct type
        }
    }, [session, isNtsUser]);

    useEffect(() => {
        const checkUserType = async () => {
            if (session?.user?.id) {
                const { data: ntsUserData, error: ntsUserError } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single();

                if (ntsUserError) {
                    console.error('Error fetching nts_user role:', ntsUserError.message);
                } else if (ntsUserData) {
                    setIsNtsUser(true);
                    const quotes = await fetchOrdersForNtsUsers(session.user.id);
                    setQuotes(quotes);
                    return;
                }

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError.message);
                } else if (profileData?.company_id) {
                    const quotes = await fetchQuotesForCompany(profileData.company_id);
                    setQuotes(quotes);
                    return;
                }

                fetchQuotes();
            }
        };

        checkUserType();
    }, [session, fetchQuotes, fetchOrdersForNtsUsers, fetchQuotesForCompany]);

    useEffect(() => {
        const filteredAndSorted = quotes
            .filter((quote) => {
                const value = quote[searchColumn]?.toString().toLowerCase() || '';
                return value.includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                if (a[sortConfig.column] < b[sortConfig.column]) {
                    return sortConfig.order === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.column] > b[sortConfig.column]) {
                    return sortConfig.order === 'asc' ? 1 : -1;
                }
                return 0;
            });

        setSortedQuotes(filteredAndSorted);
    }, [quotes, sortConfig, searchTerm, searchColumn]);

    const handleSort = (column: string, order: string) => {
        setSortConfig({ column, order: order as 'asc' | 'desc' });
    };

    useEffect(() => {
        if (searchTerm) {
            const orderId = parseInt(searchTerm, 10);
            if (!isNaN(orderId)) {
                setExpandedRow(orderId);
            }
        }
    }, [searchTerm]);

    const handleRowClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const archiveOrder = async (quoteId: number) => {
        const { error } = await supabase
            .from('shippingquotes')
            .update({ is_archived: true })
            .eq('id', quoteId);

        if (error) {
            console.error('Error archiving quote:', error.message);
            setErrorText('Error archiving quote');
        } else {
            setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== quoteId));
        }
    };

    const handleMarkAsComplete = async (quoteId: number): Promise<void> => {
        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update({ is_complete: true })
                .eq('id', quoteId);

            if (error) {
                console.error('Error marking quote as complete:', error.message);
                setErrorText('Error marking quote as complete');
            } else {
                const quote = quotes.find(q => q.id === quoteId);
                if (quote) {
                    // Fetch the template for order completion
                    const { data: templateData, error: templateError } = await supabase
                        .from('templates')
                        .select('content, title')
                        .eq('context', 'order')
                        .single();

                    if (templateError) {
                        console.error('Error fetching template:', templateError.message);
                        return;
                    }

                    // Generate PDF and upload to Supabase
                    const pdf = await generatePDF(quote, templateData.content);
                    const fileName = `${templateData.title.replace(/\s+/g, '_')}_for_Quote_${quote.id}.pdf`;
                    const filePath = await uploadPDFToSupabase(pdf, fileName);
                    await insertDocumentRecord(filePath, quote, templateData.title);

                    // Create a notification for the user
                    const notificationMessage = `Order ID ${quote.id} was delivered. <a class="text-ntsLightBlue underline font-semibold" href="/user/documents">View Order Details</a>`;
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: quote.user_id,
                            message: notificationMessage,
                            is_read: false,
                        });
                }
                setQuotes(quotes.filter(quote => quote.id !== quoteId));
            }
        } catch (error) {
            console.error('Error marking quote as complete:', error);
            setErrorText('Error marking quote as complete');
        }
        setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== quoteId));
    };

    const handleEditQuote = (quote: ShippingQuotesRow) => {
        setIsEditMode(true);
        setEditData(quote);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedQuoteId === null) return;

        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update(editData)
                .eq('id', selectedQuoteId);

            if (error) {
                console.error('Error editing quote:', error.message);
                setErrorText('Error editing quote');
            } else {
                setQuotes(quotes.map(quote => (quote.id === selectedQuoteId ? { ...quote, ...editData } : quote)));
                setIsModalOpen(false);
                setSelectedQuoteId(null);
                setEditData({});
            }
        } catch (error) {
            console.error('Error editing quote:', error);
            setErrorText('Error editing quote. Please check your internet connection and try again.');
        }
    };

    const confirmCancelQuote = async () => {
        if (selectedQuoteId === null) return;

        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update({ status: 'cancelled', cancellation_reason: cancellationReason })
                .eq('id', selectedQuoteId);

            if (error) {
                console.error('Error cancelling quote:', error.message);
                setErrorText('Error cancelling quote');
            } else {
                setQuotes(quotes.filter(quote => quote.id !== selectedQuoteId));
                setIsModalOpen(false);
                setSelectedQuoteId(null);
                setCancellationReason('');
            }
        } catch (error) {
            console.error('Error cancelling quote:', error);
            setErrorText('Error cancelling quote. Please check your internet connection and try again.');
        }
    };

    const handleGeneratePDF = async (quoteId: number) => {
        try {
            const quote = quotes.find(q => q.id === quoteId);
            if (quote) {
                // Fetch the template for order completion
                const { data: templateData, error: templateError } = await supabase
                    .from('templates')
                    .select('content, title')
                    .eq('context', 'order')
                    .single();

                if (templateError) {
                    console.error('Error fetching template:', templateError.message);
                    return;
                }

                // Generate PDF and upload to Supabase
                const pdf = await generatePDF(quote, templateData.content);
                const fileName = `${templateData.title.replace(/\s+/g, '_')}_for_Quote_${quote.id}.pdf`;
                const filePath = await uploadPDFToSupabase(pdf, fileName);
                await insertDocumentRecord(filePath, quote, templateData.title);

                // Create a notification for the user
                const notificationMessage = `Quote ID ${quote.id} was delivered. <a class="text-ntsLightBlue underline font-semibold" href="/user/documents">View Quote</a>`;
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: quote.user_id,
                        message: notificationMessage,
                        is_read: false,
                    });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            setErrorText('Error generating PDF. Please check your internet connection and try again.');
        }
    };

    return (
        <div className="w-full bg-white  shadow rounded-md max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden 2xl:block overflow-x-auto">
                <OrderTable
                    sortConfig={{ column: 'id', order: 'asc' }}
                    handleSort={handleSort}
                    orders={quotes}
                    expandedRow={expandedRow}
                    handleRowClick={handleRowClick}
                    archiveOrder={archiveOrder}
                    handleMarkAsComplete={(id) => () => handleMarkAsComplete(id)}
                    isAdmin={isAdmin}
                    handleEditClick={handleEditQuote}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchColumn={searchColumn}
                    setSearchColumn={setSearchColumn}
                />
            </div>
            <div className="block md:hidden">
                <div className='mt-1'>
                    {quotes.map((quote) => (
                        <div key={quote.id} className="bg-white dark:bg-zinc-800 shadow rounded-md mb-4 p-4 border border-zinc-400 dark:text-white">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-extrabold dark:text-white">ID</div>
                                <div className="text-sm text-zinc-900">{quote.id}</div>
                            </div>
                            <div className='border-b border-zinc-600 mb-4'></div>
                            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Origin</div>
                                <div className="text-sm text-zinc-900 dark:text-white">{quote.origin_street} {quote.origin_city}, {quote.origin_state} {quote.origin_zip}</div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Destination</div>
                                <div className="text-sm text-zinc-900 dark:text-white">{quote.destination_street} {quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Freight</div>
                                <div className="text-sm text-zinc-900 dark:text-white">{quote.year} {quote.make} {quote.model}</div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Shipping Date</div>
                                <div className="text-sm text-zinc-900 dark:text-white">{quote.due_date || 'No due date'}</div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Price</div>
                                <div className="text-sm text-zinc-900 dark:text-white">{quote.price ? `$${quote.price}` : 'coming soon'}</div>
                            </div>
                            <div className="h-full flex justify-between items-center">
                                <button onClick={() => { setSelectedQuoteId(quote.id); setIsModalOpen(true); }} className="text-red-500 ml-2">
                                    Cancel Quote
                                </button>
                                {isNtsUser && (
                                    <>
                                        <button onClick={() => handleMarkAsComplete(quote.id)} className="text-green-600 ml-2">
                                            Quote Completed
                                        </button>
                                        <button onClick={() => handleEditQuote(quote)} className="text-blue-600 dark:text-blue-400 ml-2">
                                            Edit Quote
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2 className="text-xl mb-4">Are you sure you want to cancel the quote?</h2>
                <button onClick={confirmCancelQuote} className="bg-red-500 text-white px-4 py-2 rounded mr-2">
                    Yes
                </button>
                <button onClick={() => setIsModalOpen(false)} className="bg-zinc-500 text-white px-4 py-2 rounded">
                    No
                </button>
                {selectedQuoteId !== null && (
                    <div className="mt-4">
                        <label htmlFor="reason" className="block text-sm text-zinc-700">
                            Reason for cancellation:
                        </label>
                        <input
                            type="text"
                            id="reason"
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="mt-1 p-2 border border-zinc-300 rounded w-full"
                        />
                    </div>
                )}
            </Modal>
            {isEditMode && (
                <Modal isOpen={isEditMode} onClose={() => setIsEditMode(false)}>
                    <h2 className="text-xl mb-4">Edit Quote</h2>
                    <form onSubmit={handleEditSubmit}>
                        <div className="mb-4">
                            <label htmlFor="origin_street" className="block text-sm text-zinc-700">
                                Origin Street
                            </label>
                            <input
                                type="text"
                                id="origin_street"
                                name="origin_street"
                                value={editData.origin_street || ''}
                                onChange={handleEditChange}
                                className="mt-1 p-2 border border-zinc-300 rounded w-full"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="destination_street" className="block text-sm text-zinc-700">
                                Destination Street
                            </label>
                            <input
                                type="text"
                                id="destination_street"
                                name="destination_street"
                                value={editData.destination_street || ''}
                                onChange={handleEditChange}
                                className="mt-1 p-2 border border-zinc-300 rounded w-full"
                            />
                        </div>
                        <button onClick={handleEditSubmit} className="btn-slate">
                            Submit Changes
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default OrderList;