import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import Modal from '@/components/ui/Modal';
import jsPDF from 'jspdf';
import DeliveredTable from './DeliveredTable';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface DeliveredListProps {
    session: Session | null;
    selectedUserId: string;
    fetchQuotes: () => void;
    isAdmin: boolean;
    companyId: string;
}

const DeliveredList: React.FC<DeliveredListProps> = ({ session, isAdmin, companyId, fetchQuotes }) => {
    const [quotes, setQuotes] = useState<ShippingQuotesRow[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [cancellationReason, setCancellationReason] = useState<string>('');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editData, setEditData] = useState<Partial<ShippingQuotesRow>>({});
    const [isNtsUser, setIsNtsUser] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [deliveredQuotes, setDeliveredQuotes] = useState<ShippingQuotesRow[]>([]);

    const fetchDeliveredQuotesForNtsUsers = useCallback(
        async (userId: string) => {
            const { data: companySalesUsers, error: companySalesUsersError } = await supabase
                .from("company_sales_users")
                .select("company_id")
                .eq("sales_user_id", userId);

            if (companySalesUsersError) {
                console.error(
                    "Error fetching company_sales_users for nts_user:",
                    companySalesUsersError.message
                );
                return [];
            }

            const companyIds = companySalesUsers.map(
                (companySalesUser) => companySalesUser.company_id
            );

            const { data: quotes, error: quotesError } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("company_id", companyIds)
                .eq("is_complete", true); // Fetch only delivered quotes

            if (quotesError) {
                console.error(
                    "Error fetching delivered quotes for nts_user:",
                    quotesError.message
                );
                return [];
            }

            return quotes;
        },
        []
    );

    const fetchDeliveredQuotesForCompany = useCallback(async (companyId: string) => {
        const { data: quotes, error: quotesError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_complete', true);

        if (quotesError) {
            console.error('Error fetching delivered quotes for company:', quotesError.message);
            return [];
        }

        return quotes;
    }, []);

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
                    const quotes = await fetchDeliveredQuotesForNtsUsers(session.user.id);
                    setDeliveredQuotes(quotes);
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
                    const quotes = await fetchDeliveredQuotesForCompany(profileData.company_id);
                    setDeliveredQuotes(quotes);
                    return;
                }

                fetchQuotes();
            }
        };

        checkUserType();
    }, [session, fetchDeliveredQuotesForNtsUsers, fetchDeliveredQuotesForCompany, companyId]);

    useEffect(() => {
        const channel = supabase
            .channel('shippingquotes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shippingquotes' },
                (payload) => {
                    console.log('Change received!', payload);
                    if (payload.eventType === 'UPDATE' && payload.new.is_complete) {
                        fetchDeliveredQuotesForCompany(companyId);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup subscription
        };
    }, [fetchDeliveredQuotesForCompany, companyId]);

    const generatePDF = (quote: ShippingQuotesRow) => {
        const doc = new jsPDF();
        doc.text(`Order Receipt`, 10, 10);
        doc.text(`Quote ID: ${quote.id}`, 10, 20);
        doc.text(`Origin: ${quote.origin_street}, ${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`, 10, 30);
        doc.text(`Destination: ${quote.destination_street}, ${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`, 10, 40);
        doc.text(`Freight: ${quote.year} ${quote.make} ${quote.model}`, 10, 50);
        doc.text(`Shipping Date: ${quote.due_date || 'No due date'}`, 10, 60);
        doc.text(`Price: ${quote.price ? `$${quote.price}` : 'Not priced yet'}`, 10, 70);
        return doc;
    };

    const uploadPDFToSupabase = async (pdf: jsPDF, quote: ShippingQuotesRow) => {
        const pdfBlob = pdf.output('blob');
        const fileName = `receipts/${quote.id}.pdf`;
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(fileName, pdfBlob);

        if (error) {
            throw new Error(error.message);
        }

        return data.path;
    };

    const insertDocumentRecord = async (filePath: string, quote: ShippingQuotesRow) => {
        const { error } = await supabase
            .from('documents')
            .insert({
                user_id: quote.user_id,
                title: `Receipt for Quote ${quote.id}`,
                description: `Receipt for Quote ${quote.id}`,
                file_name: `${quote.id}.pdf`,
                file_type: 'application/pdf',
                file_url: filePath,
            });

        if (error) {
            throw new Error(error.message);
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
                setQuotes(quotes.filter(quote => quote.id !== quoteId));
            }
        } catch (error) {
            console.error('Error marking quote as complete:', error);
            setErrorText('Error marking quote as complete');
        }
        setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== selectedQuoteId));
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

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
        const newStatus = e.target.value;

        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) {
                console.error('Error updating status:', error.message);
                setErrorText('Error updating status');
            } else {
                setQuotes(quotes.map(quote => (quote.id === id ? { ...quote, status: newStatus } : quote)));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setErrorText('Error updating status. Please check your internet connection and try again.');
        }
    };

    const duplicateQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        const newQuote = {
            user_id: quote.user_id,
            company_id: quote.company_id,
            origin_zip: quote.origin_zip,
            origin_city: quote.origin_city,
            origin_state: quote.origin_state,
            destination_zip: quote.destination_zip,
            destination_city: quote.destination_city,
            destination_state: quote.destination_state,
            due_date: null,
            freight_type: quote.freight_type,
            status: 'Quote',
            inserted_at: new Date().toISOString(),
            is_complete: false,
            is_archived: false,
            year: quote.year,
            make: quote.make,
            model: quote.model,
            length: quote.length,
            width: quote.width,
            height: quote.height,
            weight: quote.weight,
            commodity: quote.commodity,
            pallet_count: quote.pallet_count,
            price: quote.price,
            notes: quote.notes,
        };

        const { data, error } = await supabase
            .from('shippingquotes')
            .insert([newQuote])
            .select();

        if (error) {
            console.error('Error duplicating quote:', error.message);
            setErrorText('Error duplicating quote');
        } else {
            if (data && data.length > 0) {
                setPopupMessage(`Quote Successfully Created - Quote #${data[0].id}`);
            }
            fetchDeliveredQuotesForCompany(companyId); // Fetch delivered quotes to update the list
        }
    };

    return (
        <div className="w-full bg-white max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            {!!popupMessage && <div className="text-green-500">{popupMessage}</div>}
            <div className="hidden lg:block overflow-x-auto">
                <DeliveredTable
                    quotes={deliveredQuotes}
                    fetchDeliveredQuotes={() => fetchDeliveredQuotesForCompany(companyId)}
                    handleStatusChange={handleStatusChange}
                    handleEditClick={handleEditQuote}
                    handleMarkAsComplete={handleMarkAsComplete}
                    duplicateQuote={duplicateQuote} // Pass the duplicateQuote function
                    isAdmin={isAdmin}
                    sortConfig={{ column: 'id', order: 'asc' }} // Example sortConfig
                    handleSort={(key) => console.log(`Sorting by ${key}`)} // Example handleSort function
                />
            </div>
            <div className="block md:hidden">
                <div className='mt-1'>
                    {deliveredQuotes.map((quote) => (
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

                                <button onClick={() => duplicateQuote(quote)} className="text-ntsLightBlue font-medium underline">
                                    Duplicate Quote
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeliveredList;