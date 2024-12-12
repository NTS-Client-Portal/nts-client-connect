import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import OrderFormModal from './OrderFormModal';
import EditQuoteModal from './EditQuoteModal';
import QuoteDetailsMobile from '../mobile/QuoteDetailsMobile';
import TableHeaderSort from './TableHeaderSort';
import EditHistory from './EditHistory'; // Adjust the import path as needed

interface QuoteListProps {
    session: Session | null;
    fetchQuotes: () => void;
    archiveQuote: (id: number) => Promise<void>;
    transferToOrderList: (quoteId: number, data: any) => Promise<void>;
    handleSelectQuote: (id: number) => void;
    isAdmin: boolean;
}

const freightTypeMapping: { [key: string]: string } = {
    equipment: 'Equipment/Machinery',
    containers: 'Containers',
    rv_trailers: 'RV/Trailers',
    semi_trucks: 'Semi Trucks',
    boats: 'Boats',
    ltl_ftl: 'LTL/FTL',
};

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

            const { error: historyError } = await supabase
                .from('edit_history')
                .insert({
                    quote_id: quoteToEdit.id,
                    edited_by: session.user.id,
                    changes: JSON.stringify(changes),
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
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md max-h-max flex-grow">
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
            <div className="flex gap-1 border-b border-gray-300">
                <button
                    className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'quotes' ? 'bg-zinc-600 text-white border-zinc-500' : 'bg-zinc-200'}`}
                    onClick={() => setActiveTab('quotes')}
                >
                    Quotes
                </button>
                <button
                    className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'editHistory' ? 'bg-zinc-600 text-white border-zinc-500' : 'bg-zinc-200'}`}
                    onClick={() => setActiveTab('editHistory')}
                >
                    Edit History
                </button>
            </div>
            <div className="flex justify-start gap-4 my-4 ml-4">
                <div className="flex items-center">
                    <label className="mr-2">Search by:</label>
                    <select
                        value={searchColumn}
                        onChange={(e) => setSearchColumn(e.target.value)}
                        className="border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="id">ID</option>
                        <option value="freight_type">Freight Type</option>
                        <option value="origin_city">Origin City</option>
                        <option value="destination_city">Destination City</option>
                        <option value="due_date">Shipping Date</option>
                    </select>
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="border border-gray-300 pl-2 rounded-md shadow-sm"
                />
            </div>

            {activeTab === 'quotes' && (
                <div className="hidden 2xl:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                        <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 static top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    <TableHeaderSort column="Freight Description" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    <TableHeaderSort column="origin_city" sortOrder={sortConfig.column === 'origin_city' ? sortConfig.order : null} onSort={handleSort} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    <TableHeaderSort column="destination_city" sortOrder={sortConfig.column === 'destination_city' ? sortConfig.order : null} onSort={handleSort} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    <TableHeaderSort column="due_date" sortOrder={sortConfig.column === 'due_date' ? sortConfig.order : null} onSort={handleSort} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedQuotes.map((quote) => (
                                <React.Fragment key={quote.id}>
                                    <tr onClick={() => handleRowClick(quote.id)} className="cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                            <span className='text-base text-zinc-900'>{quote.container_length ? `${quote.container_length} ft ` : ''} {quote.container_type} </span> <br />
                                            <span className='text-base text-zinc-900'>{quote.year ? `${quote.year} ` : ''} {quote.make} {quote.model}</span> <br />
                                            <span className='font-semibold text-sm text-gray-700'>Freight Type:</span> {freightTypeMapping[quote.freight_type] || quote.freight_type.toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(quote.due_date)}</td>
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
            )}
            {activeTab === 'editHistory' && quoteToEdit && (
                <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                    <EditHistory quoteId={quoteToEdit.id} />
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