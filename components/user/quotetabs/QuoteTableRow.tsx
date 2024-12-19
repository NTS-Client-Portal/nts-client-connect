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
    handleRespond: (quoteId: number) => void;
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

    return (
        <>
            <tr
                onClick={() => handleRowClick(quote.id)}
                className={`cursor-pointer mb-4 ${rowIndex % 2 === 0 ? 'bg-white h-fit' : 'bg-gray-100'}`}
            >
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                <td className="py-3 pr-12 flex flex-col gap-2 place-items-center justify-around h-full whitespace-nowrap text-sm font-medium text-gray-900">
            
                    
                            <div className='p-0 m-0 text-start'>
                                {Array.isArray(quote.shipment_items) ? quote.shipment_items.map((item: any, index) => (
                                    <>
                                        {item.container_length && item.container_type && typeof item === 'object' && (
                                            <span className='flex flex-col gap-0'>
                                                <span className='font-semibold text-sm text-gray-700 p-0'>Shipment Item {index + 1}:</span>
                                                <span className='text-base text-zinc-900 p-0'>{`${item.container_length} ft ${item.container_type}`}</span>
                                            </span>
                                        )}
                                        {item.year && item.make && item.model && (
                                            <span className='flex flex-col gap-0'>
                                                <span className='font-semibold text-sm text-gray-700 p-0'>Shipment Item {index + 1}:</span>
                                                <span className='text-base text-zinc-900 p-0'>{`${item.year} ${item.make} ${item.model}`}</span>
                                            </span>
                                        )}
                                    </>
                                )) : (
                                    <>
                                        <div className='text-start'>
                                            {quote.container_length && quote.container_type && (
                                                <>
                                    <span className='font-semibold text-sm text-gray-700 p-0 text-start'>Shipment Item:</span><br />
                                    <span className='text-normal text-zinc-900  text-start'>{`${quote.container_length} ft ${quote.container_type}`}</span>
                                                </>
                                            )}
                                            {quote.year && quote.make && quote.model && (
                                                    <>
                                                        <span className='font-semibold text-sm text-gray-700 p-0 text-start'>Shipment Item:</span><br />
                                                        <span className='text-normal text-zinc-900 text-start'>{`${quote.year} ${quote.make} ${quote.model}`}</span>
                                                    </>
                                            )}
                                        </div>
                                    </>
                                )}
                        <div className='text-start pt-1'>
                            <span className='font-semibold text-xs text-gray-700 text-start'>Freight Type:</span>
                            <span className='text-xs text-zinc-900 text-start pl-1'>{freightTypeMapping[quote.freight_type] || (quote.freight_type ? quote.freight_type.toUpperCase() : 'N/A')}</span>
                        </div>
                            </div>
                </td>
                <td className="text-start py-3 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                <td className="pr-12 pl-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                <td className="pr-12 pl-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(quote.due_date)}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.price ? quote.price : 'Pending'}</td>
                <td className="pr-6 py-3 whitespace-nowrap text-sm text-gray-500">
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
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRespond(quote.id);
                                }}
                                className="text-ntsLightBlue font-medium underline"
                            >
                                Price Quote Request
                            </button>
                        )}
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