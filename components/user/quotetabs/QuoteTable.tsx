import React, { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/database.types';
import EditHistory from '../../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import TableHeaderSort from './TableHeaderSort';

interface QuoteTableProps {
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    fetchQuotes: () => void;
    archiveQuote: (id: number) => Promise<void>;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (quoteId: number) => void;
    handleRespond: (quoteId: number) => void;
    isAdmin: boolean;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    companyId: string;
    editHistory: Database['public']['Tables']['edit_history']['Row'][];
    fetchEditHistory: (companyId: string) => void;
}

const QuoteTable: React.FC<QuoteTableProps> = ({
    quotes,
    fetchQuotes,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
    duplicateQuote,
    reverseQuote,
    companyId,
    editHistory,
    fetchEditHistory,
}) => {
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');
    const [sortedQuotes, setSortedQuotes] = useState(quotes);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('quotes');
    const supabase = useSupabaseClient<Database>();

    useEffect(() => {
        const filtered = quotes.filter((quote) => {
            const value = quote[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });

        setSortedQuotes(filtered);
    }, [searchTerm, searchColumn, quotes]);

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

    const handleSort = (column: string, order: string) => {
        setSortConfig({ column, order });
    };

    const handleRowClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'editHistory') {
            fetchEditHistory(companyId);
        }
    };

    const handleStatusChange = async (quoteId: number, newStatus: string) => {
        const { error } = await supabase
            .from('shippingquotes')
            .update({ status: newStatus })
            .eq('id', quoteId);

        if (error) {
            console.error('Error updating status:', error.message);
        } else {
            fetchQuotes();
        }
    };

    return (
        <div className='w-full'>
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
            <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 static top-0 w-full">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="freight_type" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
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
                    {sortedQuotes.map((quote, index) => (
                        <React.Fragment key={quote.id}>
                            <tr
                                onClick={() => handleRowClick(quote.id)}
                                className={`cursor-pointer mb-4 ${index % 2 === 0 ? 'bg-white h-fit' : 'bg-gray-100'}`}
                            >
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                                <td className="py-3 px-6 flex flex-col place-items-center justify-around h-full whitespace-nowrap text-sm font-medium text-gray-900">
                                    {Array.isArray(quote.shipment_items) ? quote.shipment_items.map((item: any, index) => (
                                        <div key={index} className='mb-2'>
                                            {item.container_length && item.container_type && typeof item === 'object' && (
                                                <>
                                                    <span className='font-semibold text-sm text-gray-700 p-0 mb-1'>Shipment Item {index + 1}:</span>
                                                    <span className='text-base text-zinc-900 p-0'>{`${item.container_length} ft ${item.container_type}`}</span>
                                                </>
                                            )}
                                            {item.year && item.make && item.model && (
                                                <span className='flex flex-col mb-1'>
                                                    <span className='font-semibold text-sm text-gray-700 p-0'>Shipment Item {index + 1}:</span>
                                                    <span className='text-base text-zinc-900'>{`${item.year} ${item.make} ${item.model}`}</span>
                                                </span>
                                            )}
                                        </div>
                                    )) : (
                                        <>
                                            {quote.container_length && quote.container_type && (
                                                <>
                                                    <span className='font-semibold text-sm text-gray-700 pb-0'>Shipment Item:</span>
                                                    <span className='text-normal text-zinc-900 pt-0'>{`${quote.container_length} ft ${quote.container_type}`}</span>
                                                </>
                                            )}
                                            {quote.year && quote.make && quote.model && (
                                                <span className='flex flex-col'>
                                                    <span className='font-semibold text-sm text-gray-700 pb-0'>Shipment Item:</span>
                                                    <span className='text-[15px] text-zinc-900 pt-0'>{`${quote.year} ${quote.make} ${quote.model}`}</span>
                                                </span>
                                            )}
                                        </>
                                    )}
                                    <span className='flex flex-col pt-2'>
                                        <span className='font-semibold text-xs text-gray-700 p-0'>Freight Type:</span>
                                        <span className='text-xs text-zinc-900 p-0'>{freightTypeMapping[quote.freight_type] || (quote.freight_type ? quote.freight_type.toUpperCase() : 'N/A')}</span>
                                    </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(quote.due_date)}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.price ? quote.price : 'Pending'}</td>
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
                                            <select value={quote.status || 'Pending'} onChange={(e) => handleStatusChange(quote.id, e.target.value)} className="bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md">
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Dispatched">Dispatched</option>
                                                <option value="Picked Up">Picked Up</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
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
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default QuoteTable;