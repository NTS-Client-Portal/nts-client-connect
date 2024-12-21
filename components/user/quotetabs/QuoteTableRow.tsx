import React, { useState, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import EditHistory from '../../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { supabase } from '@/lib/initSupabase';

interface QuoteTableRowProps {
    quote: Database['public']['Tables']['shippingquotes']['Row'];
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveQuote: (id: number) => Promise<void>;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (quoteId: number) => void;
    handleRespond: (quoteId: number, price: number) => void;
    isAdmin: boolean;
    rowIndex: number;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
}

const QuoteTableRow: React.FC<QuoteTableRowProps> = ({
    quote,
    expandedRow,
    handleRowClick,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
    rowIndex,
    duplicateQuote,
    reverseQuote,
}) => {
    const [activeTab, setActiveTab] = useState('quotedetails');
    const [editHistory, setEditHistory] = useState<Database['public']['Tables']['edit_history']['Row'][]>([]);
    const [status, setStatus] = useState(quote.status || 'Pending');
    const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
    const [priceInput, setPriceInput] = useState<string>('');
    const [showPriceInput, setShowPriceInput] = useState<boolean>(false);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);

        // Update the status in the database
        const { error } = await supabase
            .from('shippingquotes')
            .update({ status: newStatus })
            .eq('id', quote.id);

        if (error) {
            console.error('Error updating status:', error.message);
        }
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-50 text-yellow-700';
            case 'In Progress':
                return 'bg-blue-50 text-blue-700';
            case 'Dispatched':
                return 'bg-purple-50 text-purple-700';
            case 'Picked Up':
                return 'bg-indigo-50 text-indigo-700';
            case 'Delivered':
                return 'bg-green-50 text-green-700';
            case 'Completed':
                return 'bg-green-50 text-green-700';
            case 'Cancelled':
                return 'bg-red-50 text-red-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    useEffect(() => {
        if (expandedRow === quote.id && activeTab === 'editHistory') {
            const fetchEditHistory = async () => {
                const { data, error } = await supabase
                    .from('edit_history')
                    .select('*')
                    .eq('quote_id', quote.id)
                    .order('edited_at', { ascending: false });

                if (error) {
                    console.error('Error fetching edit history:', error.message);
                } else {
                    setEditHistory(data);
                }
            };

            fetchEditHistory();
        }
    }, [expandedRow, activeTab, quote.id]);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('address, assigned_sales_user, company_id, company_name, company_size, email, email_notifications, first_name, id, inserted_at, last_name, phone_number, team_role, profile_complete, profile_picture')
                .eq('id', quote.user_id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error.message);
            } else {
                setProfile(data);
            }
        };

        fetchProfile();
    }, [quote.user_id]);

    const handlePriceSubmit = async (e: React.FormEvent) => {
        e.stopPropagation();
        const price = parseFloat(priceInput);
        if (!isNaN(price)) {
            handleRespond(quote.id, price);
            setPriceInput('');
            setShowPriceInput(false);
        }
    };

    return (
        <>
            <tr
                onClick={() => handleRowClick(quote.id)}
                className={`cursor-pointer mb-4 w-max ${rowIndex % 2 === 0 ? 'bg-white h-fit w-full' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}
            >
                <td className="px-6 py-3 w-[30px] whitespace-nowrap text-sm font-medium text-gray-900">
                    {quote.id}
                    {profile && (
                        <div className="text-xs text-gray-500">
                            <div>{profile.first_name} {profile.last_name}</div>
                            <div>{profile.phone_number}</div>
                            <div>{profile.email}</div>
                        </div>
                    )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className=''>
                        {Array.isArray(quote.shipment_items) ? quote.shipment_items.map((item: any, index) => (
                            <React.Fragment key={index}>
                                {item.container_length && item.container_type && typeof item === 'object' && (
                                    <span className='flex flex-col gap-0'>
                                        <span className='font-semibold text-sm text-gray-700 p-0'>Shipment Item {index + 1}:</span>
                                        <span className='text-base text-zinc-900 p-0'>{`${item.container_length} ft ${item.container_type}`}</span>
                                    </span>
                                )}
                                {item.year && item.make && item.model && (
                                    <span className='flex flex-col gap-0 w-min'>
                                        <span className='font-semibold text-sm text-gray-700 p-0 w-min'>Shipment Item {index + 1}:</span>
                                        <span className='text-base text-zinc-900 p-0 w-min'>{`${item.year} ${item.make} ${item.model}`}</span>
                                    </span>
                                )}
                            </React.Fragment>
                        )) : (
                            <>
                                <div className='text-start w-min'>
                                    {quote.container_length && quote.container_type && (
                                        <>
                                            <span className='font-semibold text-sm text-gray-700 p-0 text-start w-min'>Shipment Item:</span><br />
                                            <span className='text-normal text-zinc-900 w-min text-start'>{`${quote.container_length} ft ${quote.container_type}`}</span>
                                        </>
                                    )}
                                    {quote.year && quote.make && quote.model && (
                                        <>
                                            <span className='font-semibold text-sm text-gray-700 p-0 text-start w-min'>Shipment Item:</span><br />
                                            <span className='text-normal text-zinc-900 text-start w-min'>{`${quote.year} ${quote.make} ${quote.model}`}</span>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        <div className='text-start pt-1 w-min'>
                            <span className='font-semibold text-xs text-gray-700 text-start w-min'>Freight Type:</span>
                            <span className='text-xs text-zinc-900 text-start px-1 w-min'>{freightTypeMapping[quote.freight_type] || (quote.freight_type ? quote.freight_type.toUpperCase() : 'N/A')}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(quote.due_date)}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {isAdmin ? (
                        showPriceInput ? (
                            <form onSubmit={handlePriceSubmit}>
                                <input
                                    type="number"
                                    value={priceInput}
                                    onChange={(e) => setPriceInput(e.target.value)}
                                    placeholder="Enter price"
                                    className="border border-gray-300 rounded-md p-1"
                                />
                                <button type="submit" className="ml-2 text-ntsLightBlue font-medium underline">
                                    Submit
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPriceInput(true);
                                }}
                                className="text-ntsLightBlue font-medium underline"
                            >
                                Price Quote Request
                            </button>
                        )
                    ) : (
                        quote.price ? quote.price : 'Pending'
                    )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className='flex flex-col gap-2'>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(quote);
                            }}
                            className="text-ntsLightBlue font-medium underline"
                        >
                            Edit Quote
                        </button>
                        {quote.price ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateOrderClick(quote.id);
                                }}
                                className="text-ntsLightBlue font-medium underline"
                            >
                                Create Order
                            </button>
                        ) : null}
                        {isAdmin && (
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className={`bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md ${getStatusClasses(status)}`}
                            >
                                <option value="Pending" className={getStatusClasses('Pending')}>Pending</option>
                                <option value="In Progress" className={getStatusClasses('In Progress')}>In Progress</option>
                                <option value="Dispatched" className={getStatusClasses('Dispatched')}>Dispatched</option>
                                <option value="Picked Up" className={getStatusClasses('Picked Up')}>Picked Up</option>
                                <option value="Delivered" className={getStatusClasses('Delivered')}>Delivered</option>
                                <option value="Completed" className={getStatusClasses('Completed')}>Completed</option>
                                <option value="Cancelled" className={getStatusClasses('Cancelled')}>Cancelled</option>
                            </select>
                        )}
                    </div>
                </td>
            </tr>
            {expandedRow === quote.id && (
                <tr className='my-4'>
                    <td colSpan={7}>
                        <div className="p-4 bg-white border-x border-b border-ntsLightBlue/30 rounded-b-md">
                            <div className="flex gap-1">
                                <button
                                    className={`px-4 py-2 ${activeTab === 'quotedetails' ? 'bg-gray-200 border-t border-ntsLightBlue' : 'bg-gray-200'}`}
                                    onClick={() => setActiveTab('quotedetails')}
                                >
                                    Quote Details
                                </button>
                                <button
                                    className={`px-4 py-2 ${activeTab === 'editHistory' ? 'bg-gray-200 border-t border-ntsLightBlue' : 'bg-gray-200'}`}
                                    onClick={() => setActiveTab('editHistory')}
                                >
                                    Edit History
                                </button>
                            </div>
                            {activeTab === 'quotedetails' && (
                                <div className='border border-gray-200 p-6 h-full'>
                                    {profile && (
                                        <div className="text-sm text-gray-700 font-normal mb-2">
                                            <div>{profile.first_name} {profile.last_name}</div>
                                            <div>{profile.phone_number}</div>
                                            <div>{profile.email}</div>
                                        </div>
                                    )}
                                    <div className='flex gap-2 items-center h-full'>
                                        <button onClick={(e) => { e.stopPropagation(); duplicateQuote(quote); }} className="body-btn ml-2">
                                            Duplicate Quote
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); reverseQuote(quote); }} className="body-btn ml-2">
                                            Flip Route Duplicate
                                        </button>
                                    </div>
                                    <button onClick={() => handleEditClick(quote)} className="text-ntsLightBlue mt-3 font-semibold text-base underline mb-4 h-full">
                                        Edit Quote
                                    </button>
                                    {renderAdditionalDetails(quote)}
                                    <button onClick={() => archiveQuote(quote.id)} className="text-red-500 mt-4 text-sm">
                                        Archive Quote
                                    </button>
                                </div>
                            )}
                            {activeTab === 'editHistory' && (
                                <div className="max-h-96">
                                    <EditHistory quoteId={quote.id} searchTerm="" searchColumn="id" editHistory={editHistory} />
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default QuoteTableRow;