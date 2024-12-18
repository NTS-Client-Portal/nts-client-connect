import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import OrderFormModal from './OrderFormModal';
import EditQuoteModal from './EditQuoteModal';
import QuoteDetailsMobile from '../mobile/QuoteDetailsMobile';
import QuoteTableHeader from './QuoteTableHeader';
import QuoteTableRow from './QuoteTableRow';
import HistoryTab from './HistoryTab'; // Adjust the import path as needed
import { freightTypeMapping, formatDate, renderAdditionalDetails } from './QuoteUtils';
import QuoteTable from './QuoteTable';

interface QuoteListProps {
    session: Session | null;
    fetchQuotes: () => void;
    archiveQuote: (id: number) => Promise<void>;
    transferToOrderList: (quoteId: number, data: any) => Promise<void>;
    handleSelectQuote: (id: number) => void;
    isAdmin: boolean;
}

const QuoteList: React.FC<QuoteListProps> = ({ session, fetchQuotes, archiveQuote, transferToOrderList, handleSelectQuote, isAdmin }) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [quote, setQuote] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [sortedQuotes, setSortedQuotes] = useState(quotes);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');
    const [activeTab, setActiveTab] = useState('quotes'); // Add this line
    const [editHistory, setEditHistory] = useState<Database['public']['Tables']['edit_history']['Row'][]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null); // Add state for popup message
    const [currentPage, setCurrentPage] = useState(1); // Add state for current page
    const rowsPerPage = 10; // Define rows per page

    const fetchShippingQuotes = async (salesUserId: string) => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select(`
                *,
                companies (
                    *
                )
            `)
            .eq('companies.assigned_sales_user', salesUserId);
    
        if (error) {
            console.error('Error fetching shipping quotes:', error.message);
            return [];
        }
    
        return data;
    };

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

    useEffect(() => {
        const filtered = quotes.filter((quote) => {
            const value = quote[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });

        setSortedQuotes(filtered);
    }, [searchTerm, searchColumn, quotes]);

    const handleSort = (column: string, order: string) => {
        setSortConfig({ column, order });
    };

    useEffect(() => {
        const fetchInitialQuotes = async () => {
            if (!session?.user?.id) return;

            const quotesData = await fetchShippingQuotes(session.user.id);

            setQuotes(quotesData);
        };

        fetchInitialQuotes();
    }, [session, supabase]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    const handleCreateOrderClick = (quoteId: number) => {
        setSelectedQuoteId(quoteId);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (data: any) => {
        if (selectedQuoteId !== null && session?.user?.id) {
            const { error } = await supabase
                .from('orders')
                .insert({
                    quote_id: selectedQuoteId,
                    user_id: session.user.id,
                    origin_street: data.originStreet,
                    destination_street: data.destinationStreet,
                    earliest_pickup_date: data.earliestPickupDate,
                    latest_pickup_date: data.latestPickupDate,
                    notes: data.notes,
                    status: 'pending',
                });

            if (error) {
                console.error('Error creating order:', error.message);
            } else {
                transferToOrderList(selectedQuoteId, data);
                setQuote(null);
            }
        }
        setIsModalOpen(false);
    };

    const handleRespond = async (quoteId: number) => {
        handleSelectQuote(quoteId);

        const { data: quote, error: fetchError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError) {
            console.error('Error fetching quote details:', fetchError.message);
            return;
        }

        const { error } = await supabase
            .from('notifications')
            .insert([{ user_id: quote.user_id, message: `You have a new response to your quote request for quote #${quote.id}` }]);

        if (error) {
            console.error('Error adding notification:', error.message);
        } else {
            const { data: userSettings, error: settingsError } = await supabase
                .from('profiles')
                .select('email, email_notifications')
                .eq('id', quote.user_id as string)
                .single();

            if (settingsError) {
                console.error('Error fetching user settings:', settingsError.message);
                return;
            }

            if (userSettings.email_notifications) {
                await sendEmailNotification(userSettings.email, 'New Notification', `You have a new response to your quote request for quote #${quote.id}`);
            }
        }
    };

    const sendEmailNotification = async (to: string, subject: string, text: string) => {
        try {
            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, subject, text }),
            });

            if (!response.ok) {
                console.error('Error sending email:', await response.json());
            }
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };

    const handleEditClick = (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        setQuoteToEdit(quote);
        setIsEditModalOpen(true);
    };

    const handleEditModalSubmit = async (updatedQuote: Database['public']['Tables']['shippingquotes']['Row']) => {
        if (quoteToEdit && session?.user?.id) {
            const { data: originalQuote, error: fetchError } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('id', quoteToEdit.id)
                .single();

            if (fetchError) {
                console.error('Error fetching original quote:', fetchError.message);
                return;
            }

            const { error: updateError } = await supabase
                .from('shippingquotes')
                .update(updatedQuote)
                .eq('id', quoteToEdit.id);

            if (updateError) {
                console.error('Error updating quote:', updateError.message);
                return;
            }

            const changes = Object.keys(updatedQuote).reduce((acc, key) => {
                if (updatedQuote[key] !== originalQuote[key]) {
                    acc[key] = { old: originalQuote[key], new: updatedQuote[key] };
                }
                return acc;
            }, {});

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError.message);
                return;
            }

            const { error: historyError } = await supabase
                .from('edit_history')
                .insert({
                    quote_id: quoteToEdit.id,
                    edited_by: session.user.id,
                    changes: JSON.stringify(changes),
                    company_id: profile.company_id, // Ensure company_id is set
                });

            if (historyError) {
                console.error('Error logging edit history:', historyError.message);
            } else {
                setQuotes((prevQuotes) =>
                    prevQuotes.map((quote) =>
                        quote.id === updatedQuote.id ? updatedQuote : quote
                    )
                );
            }
        }
        setIsEditModalOpen(false);
    };

    const handleRowClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'editHistory') {
            const fetchCompanyId = async () => {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session?.user?.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError.message);
                    return;
                }

                fetchEditHistory(profile.company_id);
            };

            fetchCompanyId();
        }
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
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md max-h-max flex-grow">
            {popupMessage && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
                    {popupMessage}
                </div>
            )}
            <OrderFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                quote={quote}
            />
            <EditQuoteModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditModalSubmit}
                quote={quoteToEdit}
            />
            <QuoteTableHeader
                sortConfig={sortConfig}
                handleSort={handleSort}
                setSortedQuotes={setSortedQuotes}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
                quoteToEdit={quoteToEdit}
                quotes={quotes}
                quote={quote}
                companyId={session?.user?.id || ''}
                editHistory={editHistory}
                fetchEditHistory={fetchEditHistory}
            />
            {activeTab === 'quotes' && (
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRows.map((quote, index) => (
                                <QuoteTableRow
                                    key={quote.id}
                                    quote={quote}
                                    expandedRow={expandedRow}
                                    handleRowClick={handleRowClick}
                                    archiveQuote={archiveQuote}
                                    handleEditClick={handleEditClick}
                                    handleCreateOrderClick={handleCreateOrderClick}
                                    handleRespond={handleRespond}
                                    isAdmin={isAdmin}
                                    rowIndex={index} // Pass row index to QuoteTableRow
                                    duplicateQuote={duplicateQuote} // Pass duplicateQuote function to QuoteTableRow
                                    reverseQuote={reverseQuote} // Pass reverseQuote function to QuoteTableRow
                                />
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-center mt-4">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(index + 1)}
                                className={`px-4 py-2 mx-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'editHistory' && (
                <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                    <HistoryTab editHistory={editHistory} searchTerm="" searchColumn="id" />
                </div>
            )}
            <div className="block 2xl:hidden">
                {quotes.map((quote) => (
                    <QuoteDetailsMobile
                        key={quote.id}
                        quote={quote}
                        formatDate={formatDate}
                        archiveQuote={archiveQuote}
                        handleEditClick={handleEditClick}
                        handleCreateOrderClick={handleCreateOrderClick}
                        handleRespond={handleRespond}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuoteList;