import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { ShippingQuote } from '@/lib/schema';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import OrderFormModal from './OrderFormModal';
import EditQuoteModal from './EditQuoteModal';

interface QuoteListProps {
    session: Session | null;
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    fetchQuotes: () => void;
    archiveQuote: (id: number) => Promise<void>;
    transferToOrderList: (quoteId: number, data: any) => Promise<void>;
    handleSelectQuote: (id: number) => void;
    isAdmin: boolean; // Add this prop
}

const QuoteList: React.FC<QuoteListProps> = ({ session, quotes, fetchQuotes, archiveQuote, transferToOrderList, handleSelectQuote, isAdmin }) => {
    const supabase = useSupabaseClient<Database>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [quote, setQuote] = useState<ShippingQuote[]>([]);
    const [isNtsUser, setIsNtsUser] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Add state for edit modal
    const [quoteToEdit, setQuoteToEdit] = useState<ShippingQuote | null>(null); // Add state for the quote to edit

    useEffect(() => {
        const checkNtsUser = async () => {
            if (session?.user?.id) {
                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    setIsNtsUser(true);
                }
            }
        };

        checkNtsUser();
    }, [session, supabase]);

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
                setQuote(quotes.filter(quote => quote.id !== selectedQuoteId));
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

    const handleEditClick = (quote: ShippingQuote) => {
        setQuoteToEdit(quote);
        setIsEditModalOpen(true);
    };

    const handleEditModalSubmit = async (updatedQuote: ShippingQuote) => {
        if (quoteToEdit && session?.user?.id) {
            const { error } = await supabase
                .from('shippingquotes')
                .update(updatedQuote)
                .eq('id', quoteToEdit.id);

            if (error) {
                console.error('Error updating quote:', error.message);
            } else {
                fetchQuotes();
            }
        }
        setIsEditModalOpen(false);
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
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md border border-zinc-400 max-h-max flex-grow">
            <OrderFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />
            <EditQuoteModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditModalSubmit}
                quote={quoteToEdit}
            />
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                    <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 sticky top-0">
                        <tr className='text-zinc-50 font-semibold border-b border-zinc-900 dark:border-zinc-100'>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">ID</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Origin/Destination</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Freight</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Dimensions</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Shipping Date</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Price</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider">Actions</th>
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
                                    <div className=" flex flex-col gap-1 text-sm font-medium text-zinc-900 w-full max-w-max">
                                        <span className='font-semibold flex gap-1'>
                                            Length:<p className='font-normal'>{quote.length}&apos;</p>
                                            Width:<p className='font-normal'>{quote.width}&apos;</p>
                                            Height<p className='font-normal'>{quote.height}&apos;</p></span>
                                        <span className='font-semibold flex gap-1'>Weight:<p className='font-normal'>{quote.weight} lbs</p></span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {formatDate(quote.due_date) || 'No due date'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {quote.price ? `$${quote.price}` : 'Quote Pending'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap flex items-end justify-between">
                                    <button onClick={() => archiveQuote(quote.id)} className="text-red-500 ml-2">
                                        Archive
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(quote)}
                                        className="body-btn"
                                    >
                                        Edit
                                    </button>
                                    {quote.price ? (
                                        <button
                                            onClick={() => handleCreateOrderClick(quote.id)}
                                            className="body-btn"
                                        >
                                            Create Order
                                        </button>
                                    ) : null}
                                    {isAdmin && (
                                        <button onClick={() => handleRespond(quote.id)} className="text-blue-500 ml-2">
                                            Respond
                                        </button>
                                    )}
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
                            <div className="text-sm font-medium text-zinc-900">{formatDate(quote.due_date)}</div>
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
                                onClick={() => handleEditClick(quote)}
                                className="body-btn"
                            >
                                Edit
                            </button>
                            {quote.price ? (
                                <button
                                    onClick={() => handleCreateOrderClick(quote.id)}
                                    className="ml-2 p-1 bg-blue-500 text-white rounded"
                                >
                                    Create Order
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleEditClick(quote)}
                                    className="body-btn"
                                >
                                    Edit
                                </button>
                            )}
                            {isAdmin && (
                                <button onClick={() => handleRespond(quote.id)} className="text-blue-500 ml-2">
                                    Respond
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuoteList;