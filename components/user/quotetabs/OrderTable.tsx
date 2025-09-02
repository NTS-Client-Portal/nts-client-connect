import React, { useState, useMemo, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { useRouter } from 'next/router';
import { 
    Search, 
    Filter, 
    Package, 
    MapPin, 
    Calendar, 
    Truck, 
    DollarSign,
    Edit,
    CheckCircle,
    Clock,
    ChevronUp,
    Copy,
    RotateCcw
} from 'lucide-react';

interface OrderTableProps {
    sortConfig: { column: string; order: string };
    handleSort: (column: string, order: string) => void;
    orders: Database['public']['Tables']['shippingquotes']['Row'][];
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveOrder: (id: number) => Promise<void>;
    handleEditClick: (order: Database['public']['Tables']['shippingquotes']['Row']) => void;
    isAdmin: boolean;
    handleMarkAsComplete: (id: number) => React.MouseEventHandler<HTMLButtonElement>;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchColumn: string;
    setSearchColumn: (column: string) => void;
}

const columnDisplayNames: { [key: string]: string } = {
    id: 'Order ID',
    freight_type: 'Load Details',
    origin_destination: 'Origin/Destination',
    due_date: 'Pickup Date',
    price: 'Price',
};

const OrderTable: React.FC<OrderTableProps> = ({
    sortConfig,
    handleSort,
    orders,
    expandedRow,
    handleRowClick,
    archiveOrder,
    handleEditClick,
    isAdmin,
    handleMarkAsComplete,
    duplicateQuote,
    reverseQuote,
    searchTerm,
    setSearchTerm,
    searchColumn,
    setSearchColumn,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'orderdetails' | 'editHistory'>('orderdetails');
    const [localOrders, setLocalOrders] = useState(orders);
    const [loadDates, setLoadDates] = useState<{ [key: number]: string }>({});
    const [deliveryDates, setDeliveryDates] = useState<{ [key: number]: string }>({});
    const rowsPerPage = 10;

    const router = useRouter();

    useEffect(() => {
        const { searchTerm, searchColumn } = router.query;
        if (searchTerm && searchColumn) {
            setSearchTerm(searchTerm as string);
            setSearchColumn(searchColumn as string);
        }
    }, [router.query, setSearchTerm, setSearchColumn]);

    useEffect(() => {
        setLocalOrders(orders);
    }, [orders]);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;

    const filteredOrders = useMemo(() => {
        let sortedQuotes = [...localOrders];

        if (sortConfig.column) {
            sortedQuotes.sort((a, b) => {
                if (a[sortConfig.column] < b[sortConfig.column]) {
                    return sortConfig.order === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.column] > b[sortConfig.column]) {
                    return sortConfig.order === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        if (searchTerm) {
            sortedQuotes = sortedQuotes.filter((quote) => {
                const shipmentItems = typeof quote.shipment_items === 'string' ? JSON.parse(quote.shipment_items) : quote.shipment_items;
                const searchString: string = [
                    quote.id,
                    quote.freight_type,
                    quote.origin_city,
                    quote.origin_state,
                    quote.origin_zip,
                    quote.destination_city,
                    quote.destination_state,
                    quote.destination_zip,
                    quote.due_date,
                    quote.price,
                    ...shipmentItems?.map((item: { year: string; make: string; model: string; container_length: string; container_type: string }) => `${item.year} ${item.make} ${item.model} ${item.container_length} ft ${item.container_type}`) || []
                ].join(' ').toLowerCase();
                return searchString.includes(searchTerm.toLowerCase());
            });
        }

        return sortedQuotes;
    }, [searchTerm, localOrders, sortConfig]);

    const sortedOrders = useMemo(() => {
        const sorted = [...filteredOrders];
        if (sortConfig.column) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.column];
                const bValue = b[sortConfig.column];
                if (aValue < bValue) {
                    return sortConfig.order === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.order === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sorted;
    }, [filteredOrders, sortConfig]);

    const currentRows = sortedOrders.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const TableHeaderSort: React.FC<{ column: string; sortOrder: string | null; onSort: (column: string, order: string) => void }> = ({ column, sortOrder, onSort }) => {
        const handleSortClick = () => {
            const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            onSort(column, newOrder);
        };

        return (
            <button onClick={handleSortClick} className="flex items-center hover:text-green-200 transition-colors">
                {columnDisplayNames[column] || column}
                {sortOrder ? (
                    <svg 
                        className={`w-4 h-4 ml-1 ${sortOrder === 'asc' ? 'text-green-300' : 'text-yellow-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 6l-6 6h4v6h4v-6h4l-6-6z"/>
                    </svg>
                ) : (
                    <svg className="w-4 h-4 ml-1 text-gray-400 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6l-6 6h4v6h4v-6h4l-6-6z"/>
                    </svg>
                )}
                {sortOrder && (
                    <span className={`ml-1 text-xs ${sortOrder === 'asc' ? 'text-green-300' : 'text-yellow-300'}`}>
                        {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </span>
                )}
            </button>
        );
    };

    function getStatusClasses(status: string): string {
        switch (status) {
            case 'In Progress':
                return 'nts-badge nts-badge-info';
            case 'Dispatched':
                return 'nts-badge nts-badge-warning';
            case 'Picked Up':
                return 'nts-badge nts-badge-warning';
            case 'Delivered':
                return 'nts-badge nts-badge-success';
            default:
                return 'nts-badge nts-badge-info';
        }
    }    async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>, id: number): Promise<void> {
        const newStatus = e.target.value;
        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update({ brokers_status: newStatus })
                .eq('id', id);

            if (error) {
                console.error('Error updating status:', error);
                return;
            }

            // Update the local state to reflect the change immediately
            setLocalOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === id ? { ...order, brokers_status: newStatus } : order
                )
            );
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>, id: number, dateType: 'load' | 'delivery'): Promise<void> {
        const newDate = e.target.value;
        try {
            const updateData = dateType === 'load' ? { load_date: newDate } : { delivery_date: newDate };
            const { error } = await supabase
                .from('shippingquotes')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error(`Error updating ${dateType} date:`, error);
                return;
            }

            // Update the local state to reflect the change immediately
            if (dateType === 'load') {
                setLoadDates(prevDates => ({
                    ...prevDates,
                    [id]: newDate,
                }));
            } else {
                setDeliveryDates(prevDates => ({
                    ...prevDates,
                    [id]: newDate,
                }));
            }
        } catch (error) {
            console.error(`Error updating ${dateType} date:`, error);
        }
    }

    async function handleSubmitDates(id: number): Promise<void> {
        try {
            const loadDate = loadDates[id];
            const deliveryDate = deliveryDates[id];

            const { error } = await supabase
                .from('shippingquotes')
                .update({ load_date: loadDate, delivery_date: deliveryDate })
                .eq('id', id);

            if (error) {
                console.error('Error updating dates:', error);
                return;
            }

            // Update the local state to reflect the change immediately
            setLocalOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === id ? { ...order, load_date: loadDate, delivery_date: deliveryDate } : order
                )
            );
        } catch (error) {
            console.error('Error updating dates:', error);
        }
    }

    return (
        <div className="w-full p-2 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-green-600" />
                        Active Orders
                    </h2>
                    <p className="text-gray-600 mt-1">Track and manage shipping orders through completion</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    {filteredOrders.length} Orders
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
                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                            placeholder="Search orders..."
                            className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                    <p className="text-gray-500">Orders will appear here once they are created from quotes</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <table className="modern-table">
                            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
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
                                {currentRows.map((order, index) => (
                                    <tr 
                                        key={order.id}
                                        onClick={() => handleRowClick(order.id)}
                                        className={`cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors duration-200`}
                                    >
                                        <td className="modern-table-cell font-medium text-green-600 underline">
                                            #{order.id}
                                        </td>
                                        <td className="modern-table-cell text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{freightTypeMapping[order.freight_type?.toLowerCase()] || order.freight_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="flex flex-col space-y-1">
                                                    <div className="text-xs text-gray-700">
                                                        <span className="font-medium">From:</span> {order.origin_city}, {order.origin_state}
                                                    </div>
                                                    <div className="text-xs text-gray-700">
                                                        <span className="font-medium">To:</span> {order.destination_city}, {order.destination_state}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs">{formatDate(order.due_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                                            {order.price ? (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4 text-green-500" />
                                                    <span className="font-semibold text-green-600 text-xs">${order.price}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                                            <span className={getStatusClasses(order.status || 'In Progress')}>
                                                {order.status || 'In Progress'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-md font-semibold">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(order);
                                                    }}
                                                    className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-800 flex items-center gap-1"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span className="text-xs">Edit</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        duplicateQuote(order);
                                                    }}
                                                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-800 flex items-center gap-1"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    <span className="text-xs">Duplicate Route</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        reverseQuote(order);
                                                    }}
                                                    className="bg-green-700 text-white px-2 py-1 rounded hover:bg-green-900 flex items-center gap-1"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    <span className="text-xs">Flip Route</span>
                                                </button>
                                                {/* Only admins (NTS users) can mark orders as complete */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={handleMarkAsComplete(order.id)}
                                                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-xs">Complete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-center mt-6">
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(index + 1)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        currentPage === index + 1
                                            ? 'bg-green-600 text-white'
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
}

export default OrderTable;