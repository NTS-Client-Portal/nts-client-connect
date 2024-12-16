import React, { useState, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import EditHistory from './EditHistory';
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
                    <td colSpan={7}>
                        <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                            <div className="flex gap-4 mb-4">
                                <button
                                    className={`px-4 py-2 ${activeTab === 'quotedetails' ? 'bg-gray-200' : 'bg-white'}`}
                                    onClick={() => setActiveTab('quotedetails')}
                                >
                                    Quote Details
                                </button>
                                <button
                                    className={`px-4 py-2 ${activeTab === 'editHistory' ? 'bg-gray-200' : 'bg-white'}`}
                                    onClick={() => setActiveTab('editHistory')}
                                >
                                    Edit History
                                </button>
                            </div>
                            {activeTab === 'quotedetails' && (
                                <div>
                                    {/* Render additional details here */}
                                    {renderAdditionalDetails(quote)}
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