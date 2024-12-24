import React, { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import NtsQuoteTable from './NtsQuoteTable';
import OrderFormModal from '../user/quotetabs/OrderFormModal';
import EditQuoteModal from '../user/quotetabs/EditQuoteModal';
import QuoteDetailsMobile from '../user/mobile/QuoteDetailsMobile';
import { freightTypeMapping, formatDate, renderAdditionalDetails } from '../user/quotetabs/QuoteUtils';

interface NtsQuoteListProps {
    session: any;
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
}

const NtsQuoteList: React.FC<NtsQuoteListProps> = ({ session, quotes: initialQuotes }) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>(initialQuotes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [quote, setQuote] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [sortedQuotes, setSortedQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');
    const [activeTab, setActiveTab] = useState('quotes'); // Add this line
    const [editHistory, setEditHistory] = useState<Database['public']['Tables']['edit_history']['Row'][]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null); // Add state for popup message

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

    const handleCreateOrderClick = (quoteId: number) => {
        setSelectedQuoteId(quoteId);
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
                setQuote(null);
            }
        }
        setIsModalOpen(false);
    };

    const handleRespond = async (quoteId: number) => {
        const price = prompt('Enter the price:');
        if (price === null) return;

        const { error } = await supabase
            .from('shippingquotes')
            .update({ price: parseFloat(price) })
            .eq('id', quoteId);

        if (error) {
            console.error('Error responding to quote:', error.message);
        } else {
            setQuotes((prevQuotes) => prevQuotes.map((quote) => quote.id === quoteId ? { ...quote, price: parseFloat(price) } : quote));
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
                setQuotes((prevQuotes) => prevQuotes.map((quote) => quote.id === updatedQuote.id ? updatedQuote : quote));
            }
        }
        setIsEditModalOpen(false);
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
            setQuotes((prevQuotes) => [...prevQuotes, ...data]);
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
            setQuotes((prevQuotes) => [...prevQuotes, ...data]);
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
                quote={quote} />
            <EditQuoteModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditModalSubmit}
                quote={quoteToEdit} />
            <div className="hidden lg:block overflow-x-auto">
                <NtsQuoteTable
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                    quotes={sortedQuotes}
                    setActiveTab={setActiveTab}
                    activeTab={activeTab}
                    editHistory={editHistory}
                    expandedRow={expandedRow}
                    handleRowClick={handleRowClick}
                    archiveQuote={null}
                    handleEditClick={handleEditClick}
                    duplicateQuote={duplicateQuote}
                    reverseQuote={reverseQuote}
                    quoteToEdit={quoteToEdit}
                    quote={quote}
                    companyId={session?.user?.id}
                    fetchEditHistory={fetchEditHistory}
                    handleCreateOrderClick={handleCreateOrderClick}
                    handleRespond={handleRespond}
                    isAdmin={session?.user?.isAdmin || false}
                />
            </div>
            <div className="block 2xl:hidden">

            </div>
        </div>
    );
}

export default NtsQuoteList;