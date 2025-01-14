import React, { useState, useEffect, useMemo } from 'react';
import EditHistory from '../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from '../user/quotetabs/QuoteUtils';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';

interface NtsQuoteTableProps {
    sortConfig: { column: string; order: string };
    handleSort: (column: string, order: string) => void;
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    activeTab: string;
    quoteToEdit: Database['public']['Tables']['shippingquotes']['Row'] | null;
    quote: Database['public']['Tables']['shippingquotes']['Row'] | null;
    companyId: string;
    editHistory: Database['public']['Tables']['edit_history']['Row'][];
    fetchEditHistory: (companyId: string) => void;
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveQuote: (id: number) => Promise<void>;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (quoteId: number) => void;
    handleRespond: (quoteId: number, price: number) => void;
    isAdmin: boolean;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
}

const NtsQuoteTable: React.FC<NtsQuoteTableProps> = ({
    sortConfig,
    handleSort,
    quotes,
    setActiveTab,
    activeTab,
    quoteToEdit,
    quote,
    companyId,
    editHistory,
    fetchEditHistory,
    expandedRow,
    handleRowClick,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
    duplicateQuote,
    reverseQuote,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = quotes.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(quotes.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');

    const filteredQuotes = useMemo(() => {
        return quotes.filter((quote) => {
            const value = quote[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });
    }, [quotes, searchTerm, searchColumn]);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, quoteId: number) => {
        const newStatus = e.target.value;

        // Update the status in the database
        const { error } = await supabase
            .from('shippingquotes')
            .update({ status: newStatus })
            .eq('id', quoteId);

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

    const [showPriceInput, setShowPriceInput] = useState(false);
    const [priceInput, setPriceInput] = useState('');

    const handlePriceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Handle price submission logic here
        setShowPriceInput(false);
    };

    const TableHeaderSort: React.FC<{ column: string; sortOrder: string | null; onSort: (column: string, order: string) => void }> = ({ column, sortOrder, onSort }) => {
        const handleSort = () => {
            const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            onSort(column, newOrder);
        };

        return (
            <button onClick={handleSort} className="flex items-center">
                {column}
                {sortOrder === 'asc' ? (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                ) : sortOrder === 'desc' ? (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                ) : (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5l-7 7h14l-7-7zM12 19l-7-7h14l-7 7z"></path>
                    </svg>
                )}
            </button>
        );
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
                    <tr >
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : 'desc'} onSort={handleSort} />
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
                    {currentRows.map((quote, index) => (
                        <React.Fragment key={quote.id}>
                            <tr
                                onClick={() => {
                                    handleRowClick(quote.id);
                                    setActiveTab('quotedetails'); // Set activeTab to 'quotedetails' when row is expanded
                                }}
                                className={`cursor-pointer mb-4 w-max ${index % 2 === 0 ? 'bg-white h-fit w-full' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}
                            >
                                <td className="px-6 py-3 w-[30px] whitespace-nowrap text-sm font-medium text-gray-900">
                                    {quote.id}
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
                                                value={quote.status}
                                                onChange={(e) => handleStatusChange(e, quote.id)}
                                                className={`bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md ${getStatusClasses(quote.status)}`}
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
                                                    {renderAdditionalDetails(quote)}
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
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default NtsQuoteTable;