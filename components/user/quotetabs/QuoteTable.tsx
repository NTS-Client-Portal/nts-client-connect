import React, { useState, useMemo } from 'react';
import EditHistory from '../../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import OrderFormModal from './OrderFormModal';
import { generatePDF, uploadPDFToSupabase, insertDocumentRecord } from '../GeneratePDF';

interface QuoteTableProps {
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
    handleCreateOrderClick: (quoteId: number) => void;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleRespond: (quoteId: number, price: number) => void;
    isAdmin: boolean;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
}

const QuoteTable: React.FC<QuoteTableProps> = ({
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
    const [quotesState, setQuotes] = useState(quotes);
    const rowsPerPage = 5;

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;

    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');

    const filteredQuotes = useMemo(() => {
        if (!searchTerm) {
            return quotes;
        }
        return quotes
            .filter((quote) => {
                const value = quote[searchColumn]?.toString().toLowerCase() || '';
                return value.includes(searchTerm.toLowerCase());
            });
    }, [searchTerm, searchColumn, quotes]);

    const currentRows = filteredQuotes.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredQuotes.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const [showPriceInput, setShowPriceInput] = useState<number | null>(null);
    const [priceInput, setPriceInput] = useState('');

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, quoteId: number) => {
        const newStatus = e.target.value;

        // Update the status in the database
        const { error } = await supabase
            .from('shippingquotes')
            .update({ brokers_status: newStatus })
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

    const handlePriceSubmit = async (e: React.FormEvent, quoteId: number) => {
        e.preventDefault();
        const price = parseFloat(priceInput);
        if (isNaN(price)) {
            console.error('Invalid price');
            return;
        }

        const { error } = await supabase
            .from('shippingquotes')
            .update({ price })
            .eq('id', quoteId);

        if (error) {
            console.error('Error updating price:', error.message);
        } else {
            setShowPriceInput(null);
            setQuotes((prevQuotes) => prevQuotes.map((quote) => quote.id === quoteId ? { ...quote, price } : quote));

            // Generate PDF and upload to Supabase
            const quote = quotes.find(q => q.id === quoteId);
            if (quote) {
                const pdf = generatePDF(quote);
                const filePath = await uploadPDFToSupabase(pdf, quote);
                await insertDocumentRecord(filePath, quote);
            }
        }
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
                        <option value="freight_type">Load Details</option>
                        <option value="origin_city">Origin</option>
                        <option value="destination_city">Destination</option>
                        <option value="due_date">Date</option>
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
                <thead className="bg-ntsBlue text-zinc-50 dark:bg-zinc-900 static top-0 w-full">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs text-nowrap font-medium uppercase tracking-wider">
                            <TableHeaderSort column="Quote ID" sortOrder={sortConfig.column === 'id' ? sortConfig.order : 'desc'} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="Load Details" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="Origin" sortOrder={sortConfig.column === 'origin_city' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="Destination" sortOrder={sortConfig.column === 'destination_city' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="Date" sortOrder={sortConfig.column === 'due_date' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider"> Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                            <TableHeaderSort column="Price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
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
                                                        <span>{`${item.length} x ${item.width} x ${item.height}, ${item.weight}`}</span>
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
                                                            <span className='text-normal text-zinc-900 text-start w-min'>{`${quote.year} ${quote.make} ${quote.model}`}<br />{`${quote.length} x ${quote.width} x ${quote.height}, ${quote.weight} lbs`}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <div className='text-start pt-1 w-min'>
                                            <span className='font-semibold text-sm text-gray-700 text-start w-min'>Freight Type:</span>
                                            <span className='text-xs text-zinc-900 text-start px-1 w-min'>{freightTypeMapping[quote.freight_type] || (quote.freight_type ? quote.freight_type.toUpperCase() : 'N/A')}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state} {quote.origin_zip}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.due_date}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.status}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {isAdmin ? (
                                        showPriceInput === quote.id ? (
                                            <form onSubmit={(e) => handlePriceSubmit(e, quote.id)}>
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
                                                    setShowPriceInput(quote.id);
                                                }}
                                                className="text-ntsLightBlue font-medium underline"
                                            >
                                                Price Quote Request
                                            </button>
                                        )
                                    ) : (
                                        quote.price ? `$${quote.price}` : 'Pending'
                                    )}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-left text-sm text-gray-500">
                                    <div className='flex flex-col justify-center text-left items-start gap-2'>
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
                                        {isAdmin ? (
                                            <select
                                                value={quote.brokers_status}
                                                onChange={(e) => handleStatusChange(e, quote.id)}
                                                className={`bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md ${getStatusClasses(quote.brokers_status)}`}>
                                                <option value="Pending" className={getStatusClasses('Pending')}>Pending</option>
                                                <option value="In Progress" className={getStatusClasses('In Progress')}>In Progress</option>
                                                <option value="Dispatched" className={getStatusClasses('Dispatched')}>Dispatched</option>
                                                <option value="Picked Up" className={getStatusClasses('Picked Up')}>Picked Up</option>
                                                <option value="Delivered" className={getStatusClasses('Delivered')}>Delivered</option>
                                                <option value="Completed" className={getStatusClasses('Completed')}>Completed</option>
                                                <option value="Cancelled" className={getStatusClasses('Cancelled')}>Cancelled</option>
                                            </select>
                                        ) : (
                                            <span><strong>Status: </strong>{quote.brokers_status ? quote.brokers_status : 'Pending'}</span>
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
                                                    <div className='flex gap-2 items-center'>
                                                        <button onClick={() => handleEditClick(quote)} className="text-ntsLightBlue mt-3 font-semibold text-base underline h-full">
                                                            Edit Quote
                                                        </button>
                                                        <button onClick={() => archiveQuote(quote.id)} className="text-red-500 mt-3 font-semibold underline text-sm">
                                                            Archive Quote
                                                        </button>
                                                    </div>
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
            <OrderFormModal
                isOpen={false} // Replace with actual state or prop
                onClose={() => { }} // Replace with actual function
                onSubmit={() => { }} // Replace with actual function
                quote={null} // Replace with actual quote data
            />
            <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-4 py-2 mx-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default QuoteTable;