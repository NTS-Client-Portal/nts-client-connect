import React, { useState, useMemo } from 'react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import { formatDate, freightTypeMapping } from './QuoteUtils';

interface OrderTableProps {
    sortConfig: { column: string; order: string };
    handleSort: (column: string, order: string) => void;
    orders: Database['public']['Tables']['shippingquotes']['Row'][];
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveOrder: (id: number) => Promise<void>;
    handleEditClick: (order: Database['public']['Tables']['shippingquotes']['Row']) => void;
    isAdmin: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({
    sortConfig,
    handleSort,
    orders,
    expandedRow,
    handleRowClick,
    archiveOrder,
    handleEditClick,
    isAdmin,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'orderdetails' | 'editHistory'>('orderdetails');
    const rowsPerPage = 10;

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = orders.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(orders.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const value = order[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });
    }, [searchTerm, searchColumn, orders]);

    const TableHeaderSort = ({ column, sortOrder, onSort }) => {
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

    function getStatusClasses(status: string): string {
        switch (status) {
            case 'Pending':
                return 'text-yellow-500';
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
                .update({ status: newStatus })
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
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"> Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.map((order, index) => (
                        <React.Fragment key={order.id}>
                            <tr
                                onClick={() => {
                                    handleRowClick(order.id);
                                    setActiveTab('orderdetails'); // Set activeTab to 'orderdetails' when row is expanded
                                }}
                                className={`cursor-pointer mb-4 w-max ${index % 2 === 0 ? 'bg-white h-fit w-full' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}
                            >
                                <td className="px-6 py-3 w-[30px] whitespace-nowrap text-sm font-medium text-gray-900">
                                    {order.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
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
                                                            <span className='text-normal text-zinc-900 text-start w-min'>{`${order.year} ${order.make} ${order.model}`}</span>
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
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{order.origin_city}, {order.origin_state}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{order.destination_city}, {order.destination_state}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(order.due_date)}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {order.price ? `$${order.price}` : 'Pending'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
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
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(e, order.id)}
                                                className={`bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md ${getStatusClasses(order.status)}`}
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
                                                        <button onClick={() => archiveOrder(order.id)} className="text-red-500 mt-3 font-semibold underline text-sm">
                                                            Archive Order
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