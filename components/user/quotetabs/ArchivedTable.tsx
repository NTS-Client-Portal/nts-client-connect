import React, {useState, useEffect, useMemo} from 'react';
import { Database } from '@/lib/database.types';
import TableHeaderSort from './TableHeaderSort';
import { formatDate, freightTypeMapping } from './QuoteUtils';
import Archived from './Archived';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface ArchivedTableProps {
        quotes: ShippingQuotesRow[];
        sortConfig: { column: string; order: string };
        handleSort: (column: string) => void;
        fetchDeliveredQuotes: () => void;
        unArchive: (quote: ShippingQuotesRow) => void;
        handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>, id: number) => void;
        isAdmin: boolean;
}

const ArchivedTable: React.FC<ArchivedTableProps> = ({
    quotes,
    sortConfig,
    handleSort,
    unArchive,
    fetchDeliveredQuotes,
    handleStatusChange,
    isAdmin,
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

    useEffect(() => {
        setArchivedQuotes(quotes.filter((quote) => quote.status === 'archived'));
    }, [quotes]);

    const handleShowArchived = () => {
        setShowArchived(!showArchived);
    };

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
        fetchDeliveredQuotes();
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
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"> Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotes.map((quote, index) => (
                            <tr key={quote.id} className={`cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
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
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.due_date}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.status}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{quote.price ? `$${quote.price}` : 'Pending'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                    <div className='flex flex-col gap-2'>
                                        <button onClick={() => unArchive(quote)} className="body-btn w-fit">
                                            Unarchive Quote
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };
    
    export default ArchivedTable;