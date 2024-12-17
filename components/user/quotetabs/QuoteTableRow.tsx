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
    rowIndex: number; // Add rowIndex prop
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void; // Add duplicateQuote prop
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void; // Add reverseQuote prop
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
    rowIndex, // Add rowIndex prop
    duplicateQuote, // Add duplicateQuote prop
    reverseQuote, // Add reverseQuote prop
}) => {
    const [activeTab, setActiveTab] = useState('quotedetails');
    const [editHistory, setEditHistory] = useState<Database['public']['Tables']['edit_history']['Row'][]>([]);

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
                className={`cursor-pointer mb-4 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}
            >
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className='flex flex-col justify-between p-0'>
                        
                        {quote.container_length && quote.container_type && (
                            <>
                                <span className='font-semibold text-sm text-gray-700 p-0  mb-1'>Freight Description:</span> 
                                <span className='text-base text-zinc-900 p-0'>{`${quote.container_length} ft ${quote.container_type}`}</span>
                            </>
                        )}
                        {quote.year && quote.make && quote.model && (
                            <span className='flex flex-col mb-1'>
                                <span className='font-semibold text-sm text-gray-700 p-0'>Freight Description:</span> 
                                <span className='text-base text-zinc-900'>{`${quote.year} ${quote.make} ${quote.model}`}</span>
                            </span>
                        )}
                        <span className='flex flex-col'>
                            <span className='font-semibold text-sm text-gray-700 p-0'>Freight Type:</span> 
                            <span className=' p-0'>{freightTypeMapping[quote.freight_type] || quote.freight_type.toUpperCase()}</span>
                        </span>
                    </span>
                </td>
                <td className="px-6 py-3 text-start whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                <td className="px-6 py-3 text-start whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                <td className="px-6 py-3 text-start whitespace-nowrap text-sm text-gray-500">{formatDate(quote.due_date)}</td>
                <td className="px-6 py-3 text-start whitespace-nowrap text-sm text-gray-500">{quote.price ? quote.price : 'Pending'}</td>
                <td className="px-6 py-3 text-start whitespace-nowrap text-sm text-gray-500">
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
                            className="ml-2 p-1 body-btn text-white rounded"
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
                            className="text-blue-500 ml-2"
                        >
                            Respond
                        </button>
                    )}

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
                                        <button onClick={(e) => {e.stopPropagation(); duplicateQuote(quote);}} className="body-btn ml-2">
                                        Duplicate Quote
                                        </button>
                                        <button onClick={(e) => {e.stopPropagation();reverseQuote(quote);}} className="body-btn ml-2">
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