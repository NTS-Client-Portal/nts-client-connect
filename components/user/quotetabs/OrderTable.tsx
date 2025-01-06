import React, { useState, useMemo, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import { formatDate, freightTypeMapping } from './QuoteUtils';
import { MoveHorizontal } from 'lucide-react';
import { useRouter } from 'next/router';

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
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchColumn: string;
    setSearchColumn: (column: string) => void;
}

const columnDisplayNames: { [key: string]: string } = {
    id: 'ID',
    freight_type: 'Load Details',
    origin_destination: 'Origin/Destination',
    due_date: 'Earliest/Latest Pickup Date',
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
    searchTerm,
    setSearchTerm,
    searchColumn,
    setSearchColumn,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'orderdetails' | 'editHistory'>('orderdetails');
    const rowsPerPage = 10;

    const router = useRouter();

    useEffect(() => {
        const { searchTerm, searchColumn } = router.query;
        if (searchTerm && searchColumn) {
            setSearchTerm(searchTerm as string);
            setSearchColumn(searchColumn as string);
        }
    }, [router.query, setSearchTerm, setSearchColumn]);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;

    const filteredOrders = useMemo(() => {
            let sortedQuotes = [...orders];
    
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
        }, [searchTerm, orders, sortConfig]);
        
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
            <button onClick={handleSortClick} className="flex items-center">
                {columnDisplayNames[column] || column}
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

    function getStatusClasses(status: string): string {
        switch (status) {
            case 'In Progress':
                return 'text-blue-500';
            case 'Dispatched':
                return 'text-purple-500';
            case 'Picked Up':
                return 'text-orange-500';
            case 'Delivered':
                return 'text-green-500';
            case 'Completed':
                return 'text-gray-500';
            case 'Cancelled':
                return 'text-red-500';
            default:
                return '';
        }
    }


    async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>, id: number): Promise<void> {
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

            // Optionally, you can update the local state to reflect the change immediately
            const updatedOrders = orders.map(order =>
                order.id === id ? { ...order, status: newStatus } : order
            );
            handleSort(sortConfig.column, sortConfig.order); // Re-sort the table if necessary
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }


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
                        <option value="origin_destination">Origin/Destination</option>
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
            <table className="min-w-full divide-y divide-zinc-200 ">
                <thead className="bg-ntsBlue border-2 border-t-orange-500 static top-0 w-full text-white">
                    <tr >
                        <th className="px-6 py-3 text-left text-xs text-nowrap font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="freight_type" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="origin_destination" sortOrder={sortConfig.column === 'origin_city' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="due_date" sortOrder={sortConfig.column === 'pickup_date_range' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.map((order, index) => (
                        <React.Fragment key={order.id}>
                            <tr
                                onClick={() => {
                                    handleRowClick(order.id);
                                    setActiveTab('orderdetails');
                                }}
                                className={`cursor-pointer mb-4 w-max ${index % 2 === 0 ? 'bg-white h-fit w-full' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}
                            >
                                <td className="px-6 py-3 w-[30px] whitespace-nowrap text-sm font-medium text-gray-900  border border-gray-200">
                                    {order.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900  border border-gray-200">
                                    <div className=''>
                                        {Array.isArray(order.shipment_items) ? order.shipment_items.map((item: any, index) => (
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
                                                    {order.container_length && order.container_type && (
                                                        <>
                                                            <span className='font-semibold text-sm text-gray-700 p-0 text-start w-min'>Shipment Item:</span><br />
                                                            <span className='text-normal text-zinc-900 w-min text-start'>{`${order.container_length} ft ${order.container_type}`}</span>
                                                        </>
                                                    )}
                                                    {order.year && order.make && order.model && (
                                                        <>
                                                            <span className='font-semibold text-sm text-gray-700 p-0 text-start w-min'>Shipment Item:</span><br />
                                                            <span className='text-normal text-zinc-900 text-start w-min'>{`${order.year} ${order.make} ${order.model}`}</span><br />
                                                            <span className='text-normal text-zinc-900 text-start w-min'>
                                                                {`${order.length} ${order.length_unit} x ${order.width} ${order.width_unit} x ${order.height} ${order.height_unit}, 
                                                                ${order.weight} ${order.weight_unit}`}
                                                                </span>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <div className='text-start pt-1 w-min'>
                                            <span className='font-semibold text-xs text-gray-700 text-start w-min'>Freight Type:</span>
                                            <span className='text-xs text-zinc-900 text-start px-1 w-min'>{freightTypeMapping[order.freight_type] || (order.freight_type ? order.freight_type.toUpperCase() : 'N/A')}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${order.origin_city}, ${order.origin_state} ${order.origin_zip}`)}&destination=${encodeURIComponent(`${order.destination_city}, ${order.destination_state} ${order.destination_zip}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {order.origin_city}, {order.origin_state} {order.origin_zip} / <br />
                                        {order.destination_city}, {order.destination_state} {order.destination_zip}
                                        <br />[map it]
                                    </a>
                                </td>

                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                                    <strong>Earliest: </strong>{order.earliest_pickup_date} <br />
                                    <strong>Latest: </strong>{order.latest_pickup_date}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                                    {order.price ? `$${order.price}` : 'Pending'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200 relative z-50">
                                    <div className='flex flex-col gap-2'>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(order);
                                            }}
                                            className="text-ntsLightBlue font-medium underline"
                                        >
                                            Edit Order
                                        </button>
                                        {isAdmin && (
                                            <>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusChange(e, order.id);
                                                    }}
                                                    className={`bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md ${getStatusClasses(order.status)}`}
                                                >
                                                    <option value="In Progress" className={getStatusClasses('In Progress')}>In Progress</option>
                                                    <option value="Dispatched" className={getStatusClasses('Dispatched')}>Dispatched</option>
                                                    <option value="Picked Up" className={getStatusClasses('Picked Up')}>Picked Up</option>
                                                    <option value="Delivered" className={getStatusClasses('Delivered')}>Delivered</option>
                                                    <option value="Completed" className={getStatusClasses('Completed')}>Completed</option>
                                                    <option value="Cancelled" className={getStatusClasses('Cancelled')}>Cancelled</option>
                                                </select>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsComplete(order.id)(e);
                                                    }}
                                                    className="text-green-600 ml-2 relative z-50"
                                                >
                                                    Mark as Complete
                                                </button>
                                                <button onClick={() => archiveOrder(order.id)} className="text-red-500 mt-3 font-semibold underline text-sm">
                                                            Archive Order
                                                        </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            {expandedRow === order.id && (
                                <tr className='my-4'>
                                    <td colSpan={7}>
                                        <div className="p-4 bg-white border-x border-b border-ntsLightBlue/30 rounded-b-md">
                                            <div className="flex gap-1">
                                                <button
                                                    className={`px-4 py-2 ${activeTab === 'orderdetails' ? 'bg-gray-200 border-t border-ntsLightBlue' : 'bg-gray-200'}`}
                                                    onClick={() => setActiveTab('orderdetails')}
                                                >
                                                    Order Details
                                                </button>
                                                <button
                                                    className={`px-4 py-2 ${activeTab === 'editHistory' ? 'bg-gray-200 border-t border-ntsLightBlue' : 'bg-gray-200'}`}
                                                    onClick={() => setActiveTab('editHistory')}
                                                >
                                                    Edit History
                                                </button>
                                            </div>
                                            {activeTab === 'orderdetails' && (
                                                <div className='border border-gray-200 p-6 h-full'>
                                                    {/* Render additional order details here */}
                                                    <div className='flex gap-2 items-center h-full'>
                                                        <button onClick={(e) => { e.stopPropagation(); /* duplicateOrder(order); */ }} className="body-btn ml-2">
                                                            Duplicate Order
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); /* reverseOrder(order); */ }} className="body-btn ml-2">
                                                            Flip Route Duplicate
                                                        </button>
                                                    </div>
                                                    <div className='flex gap-2 items-center'>
                                                        <button onClick={() => handleEditClick(order)} className="text-ntsLightBlue mt-3 font-semibold text-base underline h-full">
                                                            Edit Order
                                                        </button>

                                                    </div>
                                                </div>
                                            )}
                                            {activeTab === 'editHistory' && (
                                                <div className="max-h-96">
                                                    {/* Render edit history here */}
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

export default OrderTable;