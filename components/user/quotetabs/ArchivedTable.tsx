import React, { useState, useEffect, useMemo } from 'react';
import { Database } from '@/lib/database.types';
import TableHeaderSort from './TableHeaderSort';
import { formatDate, freightTypeMapping } from './QuoteUtils';
import { Search, Filter, Package, MapPin, Calendar, Truck, DollarSign, RotateCcw, Archive, Copy } from 'lucide-react';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface ArchivedTableProps {
    quotes: ShippingQuotesRow[];
    sortConfig: { column: string; order: string };
    handleSort: (column: string) => void;
    unArchive: (quote: ShippingQuotesRow) => void;
    handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>, id: number) => void;
    isAdmin: boolean;
    isNtsUser: boolean;
    isCompanyUser: boolean;
    companyId: string;
    duplicateQuote: (quote: ShippingQuotesRow) => void;
    reverseQuote: (quote: ShippingQuotesRow) => void;
}

const ArchivedTable: React.FC<ArchivedTableProps> = ({
    quotes,
    sortConfig,
    handleSort,
    unArchive,
    handleStatusChange,
    isAdmin,
    isNtsUser,
    isCompanyUser,
    companyId,
    duplicateQuote,
    reverseQuote,
}) => {
    const [archivedQuotes, setArchivedQuotes] = useState<ShippingQuotesRow[]>(quotes);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');

    useEffect(() => {
        setArchivedQuotes(quotes);
    }, [quotes]);

    const filteredOrders = useMemo(() => {
        return archivedQuotes.filter((order) => {
            const value = order[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });
    }, [searchTerm, searchColumn, archivedQuotes]);

    const sortedQuotes = useMemo(() => {
        const sortedQuotes = [...filteredOrders];
        if (sortConfig.column) {
            sortedQuotes.sort((a, b) => {
                if (a[sortConfig.column] < b[sortConfig.column]) {
                    return sortConfig.order === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.column] > b[sortConfig.column]) {
                    return sortConfig.order === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortedQuotes;
    }, [filteredOrders, sortConfig]);

    const handleStatusChangeWrapper = (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
        handleStatusChange(e, id);
    };

    // Status badge classes for archived orders (gray theme)
    const getStatusClasses = (status: string) => {
        const baseClasses = 'nts-badge';
        switch (status?.toLowerCase()) {
            case 'archived':
                return `${baseClasses} nts-badge-secondary`;
            case 'cancelled':
                return `${baseClasses} nts-badge-danger`;
            case 'expired':
                return `${baseClasses} nts-badge-warning`;
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
                        <Archive className="w-6 h-6 text-gray-600" />
                        Archived Orders
                    </h2>
                    <p className="text-gray-600 mt-1">Stored records of past orders and quotes</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    {filteredOrders.length} Archived
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
                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                            <option value="id">Order ID</option>
                            <option value="freight_type">Freight Type</option>
                            <option value="origin_city">Origin City</option>
                            <option value="destination_city">Destination City</option>
                            <option value="due_date">Date</option>
                        </select>
                    </div>
                    <div className="nts-search-input">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search archived orders..."
                            className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {sortedQuotes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No archived orders</h3>
                    <p className="text-gray-500">Archived orders will appear here</p>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-4">
                        {sortedQuotes.map((quote) => (
                            <div
                                key={quote.id}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                {/* Header with Quote ID and Status */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <div className="flex items-center space-x-3">
                                        <Archive className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Quote #{quote.id}</p>
                                            <p className="text-xs text-gray-500">{formatDate(quote.created_at)}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                        Archived
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    {/* Freight Details */}
                                    <div className="flex items-start space-x-3">
                                        <Truck className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {freightTypeMapping[quote.freight_type] || quote.freight_type}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="flex items-start space-x-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">
                                                    {quote.origin_city}, {quote.origin_state}
                                                </p>
                                                <div className="flex items-center text-gray-500 my-1">
                                                    <div className="w-4 border-t border-gray-300"></div>
                                                    <span className="mx-2 text-xs">to</span>
                                                    <div className="w-4 border-t border-gray-300"></div>
                                                </div>
                                                <p className="font-medium text-gray-900">
                                                    {quote.destination_city}, {quote.destination_state}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-start space-x-3">
                                        <Calendar className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">
                                                Due Date: {quote.due_date ? formatDate(quote.due_date) : 'Not set'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    {quote.price && (
                                        <div className="flex items-center space-x-3">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm font-semibold text-gray-600">
                                                ${quote.price.toLocaleString()}
                                                {quote.deposit && (
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        (+${quote.deposit} deposit)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                unArchive(quote);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateQuote(quote);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Duplicate
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                reverseQuote(quote);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Flip Route
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
                    <table className="modern-table">
                        <thead className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
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
                            {sortedQuotes.map((quote, index) => (
                                <tr 
                                    key={quote.id}
                                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-200`}
                                >
                                    <td className="modern-table-cell font-medium text-gray-600">
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
                                                <DollarSign className="w-4 h-4 text-gray-500" />
                                                <span className="font-semibold text-gray-600 text-xs">${quote.price}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                                        <span className={getStatusClasses(quote.status || 'Archived')}>
                                            {quote.status || 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-md font-semibold">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => unArchive(quote)}
                                                className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span className="text-xs">Restore</span>
                                            </button>
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
                </>
            )}
        </div>
    );
};

export default ArchivedTable;