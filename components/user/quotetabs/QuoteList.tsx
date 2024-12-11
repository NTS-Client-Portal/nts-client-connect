import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import OrderFormModal from './OrderFormModal';
import EditQuoteModal from './EditQuoteModal';

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

    useEffect(() => {
        const fetchInitialQuotes = async () => {
            const { data, error } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('user_id', session?.user?.id);

            if (error) {
                console.error('Error fetching quotes:', error.message);
            } else {
                console.log('Fetched initial quotes:', data);
                setQuotes(data);
            }
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

    const handleRowClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const renderAdditionalDetails = (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        switch (quote.freight_type) {
            case 'equipment':
                return (
                    <>
                        <div><strong>Year:</strong> {quote.year}</div>
                        <div><strong>Make:</strong> {quote.make}</div>
                        <div><strong>Model:</strong> {quote.model}</div>
                        <div><strong>Operational Condition:</strong> {quote.operational_condition ? 'Operable' : 'Inoperable'}</div>
                        <div><strong>Loading/Unloading Requirements:</strong> {quote.loading_unloading_requirements}</div>
                        <div><strong>Tarping:</strong> {quote.tarping ? 'Yes' : 'No'}</div>
                        <div><strong>Auction:</strong> {quote.auction}</div>
                        <div><strong>Buyer Number:</strong> {quote.buyer_number}</div>
                        <div><strong>Lot Number:</strong> {quote.lot_number}</div>
                    </>
                );
            case 'containers':
                return (
                    <>
                        <div><strong>Container Length:</strong> {quote.container_length}</div>
                        <div><strong>Container Type:</strong> {quote.container_type}</div>
                        <div><strong>Contents Description:</strong> {quote.contents_description}</div>
                        <div><strong>Destination Surface Type:</strong> {quote.destination_surface_type}</div>
                        <div><strong>Destination Type:</strong> {quote.destination_type ? 'Business' : 'Residential'}</div>
                        <div><strong>Goods Value:</strong> {quote.goods_value}</div>
                        <div><strong>Is Loaded:</strong> {quote.is_loaded ? 'Yes' : 'No'}</div>
                        <div><strong>Loading By:</strong> {quote.loading_by ? 'Yes' : 'No'}</div>
                        <div><strong>Origin Surface Type:</strong> {quote.origin_surface_type}</div>
                        <div><strong>Origin Type:</strong> {quote.origin_type ? 'Business' : 'Residential'}</div>
                    </>
                );
            case 'rv_trailers':
                return (
                    <>
                        <div><strong>Class Type:</strong> {quote.class_type}</div>
                        <div><strong>Make:</strong> {quote.make}</div>
                        <div><strong>Model:</strong> {quote.model}</div>
                        <div><strong>Motorized or Trailer:</strong> {quote.motorized_or_trailer}</div>
                        <div><strong>Roadworthy:</strong> {quote.roadworthy ? 'Yes' : 'No'}</div>
                        <div><strong>VIN:</strong> {quote.vin}</div>
                        <div><strong>Year:</strong> {quote.year}</div>
                    </>
                );
            case 'semi_trucks':
                return (
                    <>
                        <div><strong>Driveaway or Towaway:</strong> {quote.driveaway_or_towaway ? 'Driveaway' : 'Towaway'}</div>
                        <div><strong>Height:</strong> {quote.height}</div>
                        <div><strong>Length:</strong> {quote.length}</div>
                        <div><strong>Make:</strong> {quote.make}</div>
                        <div><strong>Model:</strong> {quote.model}</div>
                        <div><strong>VIN:</strong> {quote.vin}</div>
                        <div><strong>Weight:</strong> {quote.weight}</div>
                        <div><strong>Width:</strong> {quote.width}</div>
                        <div><strong>Year:</strong> {quote.year}</div>
                    </>
                );
            case 'boats':
                return (
                    <>
                        <div><strong>Beam:</strong> {quote.beam}</div>
                        <div><strong>Cradle:</strong> {quote.cradle ? 'Yes' : 'No'}</div>
                        <div><strong>Height:</strong> {quote.height}</div>
                        <div><strong>Length:</strong> {quote.length}</div>
                        <div><strong>Trailer:</strong> {quote.trailer ? 'Yes' : 'No'}</div>
                        <div><strong>Type:</strong> {quote.type}</div>
                        <div><strong>Weight:</strong> {quote.weight}</div>
                    </>
                );
            case 'ltl_ftl':
                return (
                    <>
                        <div><strong>Load Description:</strong> {quote.load_description}</div>
                        <div><strong>Freight Class:</strong> {quote.freight_class}</div>
                        <div><strong>Loading Assistance:</strong> {quote.loading_assistance}</div>
                        <div><strong>Packaging Type:</strong> {quote.packaging_type}</div>
                        <div><strong>Weight per Pallet/Unit:</strong> {quote.weight_per_pallet_unit}</div>
                        <div><strong>Dock / No Dock:</strong> {quote.dock_no_dock ? 'Dock' : 'No Dock'}</div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md border border-zinc-400 max-h-max flex-grow">
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
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                    <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 static top-0">
                        <tr className='text-zinc-50 font-semibold border-b border-zinc-900 dark:border-zinc-100'>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-100">ID</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-100">Origin/Destination</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-100">Freight</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-100">Dimensions</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-100">Shipping Date</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-100">Price</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs  font-semibold dark:text-white uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotes.map((quote) => (
                            <React.Fragment key={quote.id}>
                                <tr onClick={() => handleRowClick(quote.id)} className="cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.freight_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.due_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.is_complete ? 'Complete' : 'pending'}</td>
                                    <td className="px-6 py-3 whitespace-nowrap flex flex-col gap-1 items-normal justify-between z-50">
                                        <button onClick={() => archiveQuote(quote.id)} className="text-red-500 ml-2">
                                            Archive
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(quote)}
                                            className="cancel-btn"
                                        >
                                            Edit
                                        </button>
                                        {quote.price ? (
                                            <button
                                                onClick={() => handleCreateOrderClick(quote.id)}
                                                className="ml-2 p-1  body-btn text-white rounded"
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
                                {expandedRow === quote.id && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-3">
                                            {renderAdditionalDetails(quote)}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
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
                            <div className="text-sm font-medium text-zinc-900">{quote.year} {quote.make} {quote.model} <br />Freight Type: {quote.freight_type}</div>
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
                                    className="ml-2 p-1 body-btn text-white rounded"
                                >
                                    Create Order
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleEditClick(quote)}
                                    className="upload-btn"
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