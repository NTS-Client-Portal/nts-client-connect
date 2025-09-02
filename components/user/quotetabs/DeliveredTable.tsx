import React, { useState, useEffect, useMemo } from 'react';
import { Database } from '@/lib/database.types';
import TableHeaderSort from './TableHeaderSort';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { Search, Filter, Package, MapPin, Calendar, Truck, DollarSign, CheckCircle, Copy, RotateCcw } from 'lucide-react';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface DeliveredTableProps {
    quotes: ShippingQuotesRow[];
    sortConfig: { column: string; order: string };
    handleSort: (column: string) => void;
    fetchDeliveredQuotes: () => void;
    handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>, id: number) => void;
    isAdmin: boolean;
    handleEditClick: (quote: ShippingQuotesRow) => void;
    handleMarkAsComplete: (id: number) => void;
    duplicateQuote: (quote: ShippingQuotesRow) => void;
    reverseQuote: (quote: ShippingQuotesRow) => void;
}

const DeliveredTable: React.FC<DeliveredTableProps> = ({
    quotes,
    sortConfig,
    handleSort,
    handleStatusChange,
    handleEditClick,
    duplicateQuote,
    reverseQuote,
    handleMarkAsComplete,
    fetchDeliveredQuotes,
    isAdmin,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'orderdetails' | 'editHistory'>('orderdetails');
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

    // Status badge classes for delivered orders (blue theme)
    const getStatusClasses = (status: string) => {
        const baseClasses = 'nts-badge';
        switch (status?.toLowerCase()) {
            case 'delivered':
                return `${baseClasses} nts-badge-success`;
            case 'completed':
                return `${baseClasses} nts-badge-primary`;
            case 'invoiced':
                return `${baseClasses} nts-badge-info`;
            default:
                return `${baseClasses} nts-badge-secondary`;
        }
    };

    return (
        <div className="w-full p-2 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        Delivered Orders
                    </h2>
                    <p className="text-gray-600 mt-1">Successfully completed shipments and deliveries</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    {quotes.length} Delivered
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="nts-search-section">
                <div className="nts-search-row">
                    <div className="nts-search-filter">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            aria-label="Filter by column"
                            value={searchColumn}
                            onChange={(e) => setSearchColumn(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="id">Order ID</option>
                            <option value="freight_type">Freight Type</option>
                            <option value="origin_city">Origin City</option>
                            <option value="destination_city">Destination City</option>
                            <option value="due_date">Delivered Date</option>
                        </select>
                    </div>
                    <div className="nts-search-input">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search delivered orders..."
                            className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {quotes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No delivered orders</h3>
                    <p className="text-gray-500">Completed orders will appear here</p>
                </div>
               
            ) : (
                <>
                    {/* Mobile View */}
                    <div className="block md:hidden">

                        
                        {/* Mobile Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePageChange(index + 1)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                                currentPage === index + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                        
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
                        <table className="modern-table">
                            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Load Details
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Origin/Destination
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        <TableHeaderSort column="due_date" sortOrder={sortConfig.column === 'due_date' ? sortConfig.order : null} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((quote, index) => (
                                    <tr 
                                        key={quote.id}
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}
                                    >
                                        <td className="modern-table-cell font-medium text-blue-600">
                                            #{quote.id}
                                        </td>
                                        <td className="modern-table-cell text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{freightTypeMapping[quote.freight_type?.toLowerCase()] || quote.freight_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="flex flex-col space-y-1">
                                                    <div className="text-xs text-gray-700">
                                                        <span className="font-medium">From:</span> {quote.origin_city}, {quote.origin_state}
                                                    </div>
                                                    <div className="text-xs text-gray-700">
                                                        <span className="font-medium">To:</span> {quote.destination_city}, {quote.destination_state}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs">{formatDate(quote.due_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                                            {quote.price ? (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4 text-blue-500" />
                                                    <span className="font-semibold text-blue-600 text-xs">${quote.price}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                                            <span className={getStatusClasses(quote.status || 'Delivered')}>
                                                {quote.status || 'Delivered'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-md font-semibold">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => duplicateQuote(quote)}
                                                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-800 flex items-center gap-1"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    <span className="text-xs">Duplicate</span>
                                                </button>
                                                <button
                                                    onClick={() => reverseQuote(quote)}
                                                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-800 flex items-center gap-1"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    <span className="text-xs">Flip Route</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="hidden md:flex justify-center mt-6">
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(index + 1)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        currentPage === index + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
        
    );
};

export default DeliveredTable;