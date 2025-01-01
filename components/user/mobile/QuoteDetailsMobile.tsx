import React, { useState, useMemo } from 'react';
import { Database } from '@/lib/database.types'; // Adjust the import path as needed

interface QuoteDetailsMobileProps {
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    formatDate: (dateString: string | null) => string;
    archiveQuote: (id: number) => void;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (id: number) => void;
    handleRespond: (id: number) => void;
    isAdmin: boolean;
    handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>, quoteId: number) => void;
    getStatusClasses: (status: string) => string;
    setShowPriceInput: React.Dispatch<React.SetStateAction<number | null>>;
    showPriceInput: number | null;
    priceInput: string;
    setPriceInput: React.Dispatch<React.SetStateAction<string>>;
}

const QuoteDetailsMobile: React.FC<QuoteDetailsMobileProps> = ({
    quotes,
    formatDate,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
    handleStatusChange,
    getStatusClasses,
    setShowPriceInput,
    showPriceInput,
    priceInput,
    setPriceInput,
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
    }, [searchTerm, searchColumn, quotes]);

    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'asc' });

    const sortedQuotes = useMemo(() => {
        return [...filteredQuotes].sort((a, b) => {
            if (a[sortConfig.column] < b[sortConfig.column]) {
                return sortConfig.order === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.column] > b[sortConfig.column]) {
                return sortConfig.order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredQuotes, sortConfig]);

    const handleSort = (column: string) => {
        const newOrder = sortConfig.order === 'asc' ? 'desc' : 'asc';
        setSortConfig({ column, order: newOrder });
    };

    const TableHeaderSort: React.FC<{ column: string; sortOrder: string | null; onSort: (column: string) => void }> = ({ column, sortOrder, onSort }) => {
        return (
            <button onClick={() => onSort(column)} className="flex items-center">
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
        <div className="w-full">

            <div className="flex flex-col justify-center gap-2">
                <div className="flex items-end gap-2 justify-start">
                    <div className="flex flex-col w-full">
                        <label className="mr-2">Sort by:</label>
                        <select
                            value={sortConfig.column}
                            onChange={(e) => handleSort(e.target.value)}
                            className="border border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="id">ID</option>
                            <option value="price">Price</option>
                            <option value="due_date">Shipping Date</option>
                        </select>
                    </div>
                    <div className='flex items-center justify-center w-full'>
                        <button onClick={() => handleSort(sortConfig.column)} className="border w-full border-gray-300 rounded-md shadow-sm px-2 w-3/4">
                            {sortConfig.order === 'asc' ? 'Asc' : 'Desc'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-end gap-1 justify-start w-full my-4">
                <span className='w-full'>
                    <label className="text-nowrap">Search by:</label>
                    <select
                        value={searchColumn}
                        onChange={(e) => setSearchColumn(e.target.value)}
                        className="border border-gray-300 w-full rounded-md shadow-sm"
                    >
                        <option value="id">ID</option>
                        <option value="freight_type">Freight Type</option>
                        <option value="origin_city">Origin City</option>
                        <option value="destination_city">Destination City</option>
                        <option value="due_date">Shipping Date</option>
                    </select>

                </span>

                <span className='w-fit'>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="border border-gray-300 pl-2 rounded-md shadow-sm"
                    />
                </span>
            </div>
            {sortedQuotes.slice(indexOfFirstRow, indexOfLastRow).map((quote) => (
                <div key={quote.id} className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-extrabold  dark:text-white">ID</div>
                        <div className="text-sm text-zinc-900">{quote.id}</div>
                    </div>
                    <div className='border-b border-zinc-600 mb-4'></div>
                    <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                        <div className="text-sm font-extrabold  dark:text-white">Origin/Destination</div>
                        <div className="text-sm font-medium text-zinc-900">
                            <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`)}&destination=${encodeURIComponent(`${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                {quote.origin_city}, {quote.origin_state} {quote.origin_zip} / <br />
                                {quote.destination_city}, {quote.destination_state} {quote.destination_zip}
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                        <div className="text-sm font-extrabold  dark:text-white">Freight</div>
                        <div className="text-sm font-medium text-zinc-900">{quote.year} {quote.make} {quote.model} <br />Freight Type: {quote.freight_type}</div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                        <div className="text-sm font-extrabold  dark:text-white">Dimensions</div>
                        <div className="text-sm font-medium text-zinc-900">{quote.length}&apos; x {quote.width}&apos; x {quote.height}&apos; x <br />{quote.weight} lbs</div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                        <div className="text-sm font-extrabold  dark:text-white">Shipping Date</div>
                        <div className="text-sm font-medium text-zinc-900">{formatDate(quote.due_date)}</div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                        <div className="text-sm font-extrabold  dark:text-white">Price</div>
                        <div className="text-base font-semibold text-emerald-500">{quote.price ? `$${quote.price}` : 'Quote Pending'}</div>
                    </div>
                    <div className="flex justify-center gap-4 items-center">
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
                            <p></p>
                        )}
                        {isAdmin && (
                            <button onClick={() => handleRespond(quote.id)} className="text-blue-500 ml-2">
                                Respond
                            </button>
                        )}
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
                </div>
            ))}
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

export default QuoteDetailsMobile;