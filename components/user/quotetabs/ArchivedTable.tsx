import React, { useState, useEffect, useMemo } from 'react';
import { Database } from '@/lib/database.types';
import TableHeaderSort from './TableHeaderSort';
import { formatDate, freightTypeMapping } from './QuoteUtils';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface ArchivedTableProps {
    quotes: ShippingQuotesRow[];
    sortConfig: { column: string; order: string };
    handleSort: (column: string) => void;
    unArchive: (quote: ShippingQuotesRow) => void;
    handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>, id: number) => void;
    isAdmin: boolean;
    isNtsUser: boolean;
    isCompanyUser: boolean; // Add isCompanyUser prop
    companyId: string; // Add companyId prop
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
    companyId, // Add companyId prop
}) => {
    const [archivedQuotes, setArchivedQuotes] = useState<ShippingQuotesRow[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');

    const filteredOrders = useMemo(() => {
        return quotes.filter((order) => {
            const value = order[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });
    }, [searchTerm, searchColumn, quotes]);

    const sortedQuotes = useMemo(() => {
        const sortedQuotes = [...archivedQuotes];
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
    }, [archivedQuotes, sortConfig]);

    const handleStatusChangeWrapper = (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
        handleStatusChange(e, id);
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
            <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-ntsBlue border-2 border-t-orange-500 text-zinc-50 dark:bg-zinc-900 static top-0 w-full">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
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
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="Price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedQuotes.map((quote, index) => (
                        <tr key={quote.id} className={`cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{quote.id}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">
                                <div className=''>
                                    {Array.isArray(quote.shipment_items) ? quote.shipment_items.map((item: any, index) => (
                                        <React.Fragment key={index}>
                                            <div>{item.description}</div>
                                            <div>{item.quantity}</div>
                                        </React.Fragment>
                                    )) : null}
                                </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{quote.origin_city}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{quote.destination_city}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{formatDate(quote.due_date)}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{quote.status}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{quote.price ? `$${quote.price}` : 'Not priced yet'}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">
                                <button onClick={() => unArchive(quote)} className="text-blue-600 hover:text-blue-900">
                                    Unarchive
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ArchivedTable;