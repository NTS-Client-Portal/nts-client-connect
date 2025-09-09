import React, { useState, useMemo, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { formatQuoteId } from '@/lib/quoteUtils';
import { generateAndUploadDocx, replaceShortcodes } from "@/components/GenerateDocx";
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
    RotateCcw,
    Zap,
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
    // Price input functionality
    const [showPriceInput, setShowPriceInput] = useState<number | null>(null);
    const [carrierPayInput, setCarrierPayInput] = useState('');
    const [depositInput, setDepositInput] = useState('');
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

    const session = useSession();

    const handlePriceSubmit = async (e: React.FormEvent<HTMLFormElement>, orderId: number) => {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            orderPrice: HTMLInputElement;
        };
        const orderPrice = parseFloat(target.orderPrice.value);

        const { error: updateError } = await supabase
            .from('shippingquotes')
            .update({ price: orderPrice })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating price:', updateError.message);
            return;
        }

        // Fetch the updated order data
        const { data: updatedOrder, error: fetchError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError) {
            console.error('Error fetching updated order:', fetchError.message);
            return;
        }

        // Fetch the template content
        const { data: templateData, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('context', 'order')
            .single();

        if (templateError) {
            console.error('Error fetching template:', templateError.message);
            return;
        }

        const content = replaceShortcodes(templateData.content, { quote: updatedOrder });
        const title = templateData.title || 'Order Confirmation';
        const templateId = templateData.id;

        await generateAndUploadDocx(updatedOrder, content, title, templateId);

        // Save the document metadata with the template ID
        const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .insert({
                user_id: updatedOrder.user_id,
                title,
                description: 'Order Confirmation Document',
                file_name: `${title}.docx`,
                file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                file_url: `path/to/${title}.docx`,
                template_id: templateId,
            })
            .select()
            .single();

        if (documentError) {
            console.error('Error saving document metadata:', documentError.message);
        } else {
            // Update local state
            setLocalOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, price: orderPrice } : order
                )
            );
            setShowPriceInput(null);
            setCarrierPayInput('');
            setDepositInput('');
        }
    };

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
                <div className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                    <p className="text-gray-500">Orders will appear here once they are created from quotes</p>
                </div>
            ) : (
                <>
                    {/* Mobile View - Handled by parent component */}
                    <div className="block md:hidden">
                        <div className="p-4 text-center text-gray-500">
                            Mobile view handled by parent component
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-hidden">
                        <table className="modern-table w-full">
                            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-2xl">
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
                                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-2xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((order, index) => (
                                    <React.Fragment key={order.id}>
                                        <tr 
                                            onClick={() => handleRowClick(order.id)}
                                            className={`cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors duration-200`}
                                        >
                                            <td className="modern-table-cell font-medium text-green-600 underline">
                                                <div className="flex items-center gap-2">
                                                    {formatQuoteId(order.id)}
                                                    <ChevronUp 
                                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                                            expandedRow === order.id ? 'rotate-180' : ''
                                                        }`} 
                                                    />
                                                </div>
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
                                                    <span className="text-xs">{formatDate(order.earliest_pickup_date || order.due_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                {order.price ? (
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-green-500" />
                                                        <span className="font-semibold text-green-600 text-xs">${order.price}</span>
                                                    </div>
                                                ) : showPriceInput === order.id ? (
                                                    <div 
                                                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm min-w-[280px]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <form onSubmit={(e) => handlePriceSubmit(e, order.id)} onClick={(e) => e.stopPropagation()}>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                                                    <span className="text-sm font-semibold text-blue-800">Set Order Price</span>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Total Price
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        name="orderPrice"
                                                                        placeholder="0.00"
                                                                        step="0.01"
                                                                        min="0"
                                                                        required
                                                                        className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        autoFocus
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 pt-2">
                                                                    <button
                                                                        type="submit"
                                                                        className="bg-green-600 text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        Confirm Price
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowPriceInput(null);
                                                                        }}
                                                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-300 transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </form>
                                                    </div>
                                                ) : isAdmin ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowPriceInput(order.id);
                                                        }}
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        Set Price
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Pending Quote
                                                    </span>
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
                                        
                                        {/* Expanded Row Content */}
                                        {expandedRow === order.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={7} className="px-4 py-6">
                                                    {/* Quick Actions Section */}
                                                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-blue-600" />
                                                            Quick Actions
                                                        </h4>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    duplicateQuote(order);
                                                                }}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium">Copy as New Quote</div>
                                                                    <div className="text-xs opacity-90">Create a new quote request with the same details</div>
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    reverseQuote(order);
                                                                }}
                                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium">Copy with Reversed Route</div>
                                                                    <div className="text-xs opacity-90">Create new quote swapping pickup ↔ delivery locations</div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Route Information - Combined Pickup & Delivery */}
                                                        <div className="lg:col-span-2 bg-white rounded-lg p-4 border border-gray-200">
                                                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-green-600" />
                                                                Route Information
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {/* Pickup Column */}
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Pickup Address</h5>
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Contact</label>
                                                                            <p className="text-xs text-gray-900">{order.origin_name || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Phone</label>
                                                                            <p className="text-xs text-gray-900">{order.origin_phone || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Address</label>
                                                                            <p className="text-xs text-gray-900">{order.origin_street || 'N/A'}</p>
                                                                            <p className="text-xs text-gray-900">{order.origin_city}, {order.origin_state} {order.origin_zip}</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div>
                                                                                <label className="text-xs font-medium text-gray-600">Earliest</label>
                                                                                <p className="text-xs text-gray-900">{formatDate(order.earliest_pickup_date) || 'N/A'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs font-medium text-gray-600">Latest</label>
                                                                                <p className="text-xs text-gray-900">{formatDate(order.latest_pickup_date) || 'N/A'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Delivery Column */}
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Delivery Address</h5>
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Contact</label>
                                                                            <p className="text-xs text-gray-900">{order.destination_name || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Phone</label>
                                                                            <p className="text-xs text-gray-900">{order.destination_phone || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Address</label>
                                                                            <p className="text-xs text-gray-900">{order.destination_street || 'N/A'}</p>
                                                                            <p className="text-xs text-gray-900">{order.destination_city}, {order.destination_state} {order.destination_zip}</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div>
                                                                                <label className="text-xs font-medium text-gray-600">Due Date</label>
                                                                                <p className="text-xs text-gray-900">{formatDate(order.due_date) || 'N/A'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs font-medium text-gray-600">Special Req.</label>
                                                                                <p className="text-xs text-gray-900">{order.loading_unloading_requirements ? 'Yes' : 'N/A'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                        {/* Load Information - Compact */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 space-x-4 justify-items-between mt-4">
                                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <Package className="w-4 h-4 text-purple-600" />
                                                                Load Details
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-600">Type</label>
                                                                    <p className="text-xs text-gray-900">{order.freight_type}</p>
                                                                </div>
                                                                {order.freight_type?.toLowerCase() === 'equipment' && (
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Equipment</label>
                                                                        <p className="text-xs text-gray-900">{order.year} {order.make} {order.model}</p>
                                                                        {order.vin && <p className="text-xs text-gray-500">VIN: {order.vin}</p>}
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Dimensions</label>
                                                                        <p className="text-xs text-gray-900">
                                                                            {[order.length && `${order.length}${order.length_unit || 'ft'}`,
                                                                              order.width && `${order.width}${order.width_unit || 'ft'}`,
                                                                              order.height && `${order.height}${order.height_unit || 'ft'}`]
                                                                              .filter(Boolean).join(' × ') || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Weight</label>
                                                                        <p className="text-xs text-gray-900">{order.weight ? `${order.weight} ${order.weight_unit || 'lbs'}` : 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-600">Operational</label>
                                                                    <p className="text-xs text-gray-900">{order.operational_condition ? 'Yes' : 'No'}</p>
                                                                </div>
                                                                {order.commodity && (
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Commodity</label>
                                                                        <p className="text-xs text-gray-900">{order.commodity}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Order Status & Pricing */}
                                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                Order Status
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-600">Current Status</label>
                                                                    <p className="text-xs text-gray-900">{order.brokers_status || order.status || 'In Progress'}</p>
                                                                </div>
                                                                {order.price && (
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Order Value</label>
                                                                        <p className="text-sm font-semibold text-green-600">${order.price.toLocaleString()}</p>
                                                                    </div>
                                                                )}
                                                                {order.load_date && (
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Load Date</label>
                                                                        <p className="text-xs text-gray-900">{formatDate(order.load_date)}</p>
                                                                    </div>
                                                                )}
                                                                {order.delivery_date && (
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-600">Delivery Date</label>
                                                                        <p className="text-xs text-gray-900">{formatDate(order.delivery_date)}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                        {/* Additional Information - Full Width */}
                                                        {(order.loading_unloading_requirements || order.auction || order.lot_number || order.buyer_number || order.notes) && (
                                                            <div className="lg:col-span-4 bg-white rounded-lg p-4 border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-orange-600" />
                                                                    Additional Information
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {order.loading_unloading_requirements && (
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Loading/Unloading Requirements</label>
                                                                            <p className="text-xs text-gray-900">{order.loading_unloading_requirements}</p>
                                                                        </div>
                                                                    )}
                                                                    {order.notes && (
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">Notes</label>
                                                                            <p className="text-xs text-gray-900">{order.notes}</p>
                                                                        </div>
                                                                    )}
                                                                    {(order.auction || order.lot_number || order.buyer_number) && (
                                                                        <div className="md:col-span-2">
                                                                            <label className="text-xs font-medium text-gray-600 block mb-2">Auction Details</label>
                                                                            <div className="grid grid-cols-3 gap-4">
                                                                                {order.auction && (
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500">Auction</label>
                                                                                        <p className="text-xs text-gray-900">{order.auction}</p>
                                                                                    </div>
                                                                                )}
                                                                                {order.lot_number && (
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500">Lot #</label>
                                                                                        <p className="text-xs text-gray-900">{order.lot_number}</p>
                                                                                    </div>
                                                                                )}
                                                                                {order.buyer_number && (
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500">Buyer #</label>
                                                                                        <p className="text-xs text-gray-900">{order.buyer_number}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
}

export default OrderTable;