import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import Modal from '@/components/ui/Modal';
import jsPDF from 'jspdf';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface OrderListProps {
    session: Session | null;
    fetchQuotes: () => void;
    isAdmin: boolean;
}

const OrderList: React.FC<OrderListProps> = ({ session, fetchQuotes: parentFetchQuotes, isAdmin }) => {
    const [quotes, setQuotes] = useState<ShippingQuotesRow[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [cancellationReason, setCancellationReason] = useState<string>('');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editData, setEditData] = useState<Partial<ShippingQuotesRow>>({});
    const [isNtsUser, setIsNtsUser] = useState(false);

    const fetchQuotes = useCallback(async () => {
        let query = supabase
            .from('shippingquotes')
            .select('*')
            .neq('is_complete', true); // Exclude completed quotes

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
        const checkNtsUser = async () => {
            if (session?.user?.id) {
                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user role:', error.message);
                } else {
                    setIsNtsUser(!!data);
                }
            }
        };

        checkNtsUser();
        fetchQuotes();
    }, [session, fetchQuotes]);

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

    return (
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-zinc-100 shadow rounded-md border border-zinc-400 max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:text-zinc-900">
                    <thead className="bg-ntsLightBlue dark:bg-zinc-900">
                        <tr className='text-zinc-50 font-semibold border-b border-zinc-900 dark:border-zinc-100'>
                            <th className="px-2 pt-4 pb-1 text-left text-xs  dark:text-white uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">ID</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs  dark:text-white uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Origin</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs  dark:text-white uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Freight</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs  dark:text-white uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Shipping Date</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs  dark:text-white uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Price</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs  dark:text-white uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-zinc-100">
                        {quotes.map((quote) => (
                            <tr key={quote.id}>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {quote.id}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    <div className="flex flex-col justify-start">
                                        <span><strong>Origin Address:</strong>  {quote.origin_street} </span>
                                        <span><strong>Origin City/State/Zip:</strong> {quote.origin_city}, {quote.origin_state} {quote.origin_zip}</span>
                                        <span><strong>Destination Address:</strong>  {quote.destination_street} </span>
                                        <span><strong>Destination City/State/Zip:</strong> {quote.destination_city}, {quote.destination_state} {quote.destination_zip}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100 ">
                                    {quote.year} {quote.make} {quote.model}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100 ">
                                    {quote.due_date || 'No due date'}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100 ">
                                    {quote.price ? `$${quote.price}` : 'coming soon'}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    <div className='flex flex-col gap-2 items-center'>
                                        <button onClick={() => { setSelectedQuoteId(quote.id); setIsModalOpen(true); }} className="cancel-btn">
                                            Cancel Quote
                                        </button>
                                    </div>
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block 2xl:hidden mt-">
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