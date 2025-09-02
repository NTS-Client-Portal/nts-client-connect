import React, { useState, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from '../quotetabs/QuoteUtils';
import { 
    MapPin, 
    Calendar, 
    Truck, 
    DollarSign, 
    Package,
    ChevronDown,
    ChevronUp,
    Edit3,
    CheckCircle,
    Copy,
    RotateCcw,
    Clock,
    Calendar as CalendarIcon
} from 'lucide-react';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface OrderDetailsMobileProps {
    orders: ShippingQuotesRow[];
    handleEditClick: (order: ShippingQuotesRow) => void;
    handleMarkAsComplete: (id: number) => React.MouseEventHandler<HTMLButtonElement>;
    duplicateQuote: (order: ShippingQuotesRow) => void;
    reverseQuote: (order: ShippingQuotesRow) => void;
    isAdmin: boolean;
    formatDate: (date: string) => string;
    loadDates: { [key: number]: string };
    deliveryDates: { [key: number]: string };
    handleDateChange: (e: React.ChangeEvent<HTMLInputElement>, id: number, dateType: 'load' | 'delivery') => Promise<void>;
    handleSubmitDates: (id: number) => Promise<void>;
    getStatusClasses: (status: string) => string;
}

const OrderDetailsMobile: React.FC<OrderDetailsMobileProps> = ({
    orders,
    handleEditClick,
    handleMarkAsComplete,
    duplicateQuote,
    reverseQuote,
    isAdmin,
    formatDate,
    loadDates,
    deliveryDates,
    handleDateChange,
    handleSubmitDates,
    getStatusClasses,
}) => {
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (orders.length > 0) {
            setLoading(false);
        }
    }, [orders]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'in progress':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'dispatched':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'picked up':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'delivered':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'in progress':
                return <Clock className="w-3 h-3" />;
            case 'dispatched':
                return <Truck className="w-3 h-3" />;
            case 'picked up':
                return <Package className="w-3 h-3" />;
            case 'delivered':
                return <CheckCircle className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-safe">
            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading orders...</span>
                </div>
            ) : orders.length === 0 ? (
                <div className='flex flex-col h-full w-full items-center justify-center gap-6 p-6 bg-white dark:bg-gray-800 m-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                    <div className="text-center">
                        <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No active orders</h3>
                        <p className="text-gray-600 dark:text-gray-400">Orders will appear here once they are created from quotes</p>
                    </div>
                </div>
            ) : (
                <div className="p-3 space-y-3 pb-6">
                    {orders.map((order) => (
                        <div 
                            key={order.id} 
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-200 hover:shadow-md"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                            #{order.id}
                                        </div>
                                        {order.brokers_status && (
                                            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(order.brokers_status)}`}>
                                                {getStatusIcon(order.brokers_status)}
                                                <span className="hidden xs:inline">{order.brokers_status}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                        className="flex items-center text-green-600 font-medium text-sm touch-manipulation active:scale-95 transition-transform"
                                    >
                                        {expandedOrderId === order.id ? (
                                            <>
                                                <span>Less</span>
                                                <ChevronUp className="w-4 h-4 ml-1" />
                                            </>
                                        ) : (
                                            <>
                                                <span>More</span>
                                                <ChevronDown className="w-4 h-4 ml-1" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="p-4 space-y-4">
                                {/* Route Information */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                    <div className="flex items-start space-x-3">
                                        <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Route</h4>
                                            <a 
                                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${order.origin_city}, ${order.origin_state} ${order.origin_zip}`)}&destination=${encodeURIComponent(`${order.destination_city}, ${order.destination_state} ${order.destination_zip}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm touch-manipulation active:opacity-70"
                                            >
                                                <div className="font-medium truncate">{order.origin_city}, {order.origin_state} {order.origin_zip}</div>
                                                <div className="text-gray-600 dark:text-gray-400 text-xs my-1 flex items-center">
                                                    <div className="w-4 h-0.5 bg-gray-400 rounded mr-1"></div>
                                                    <div className="text-lg">→</div>
                                                    <div className="w-4 h-0.5 bg-gray-400 rounded ml-1"></div>
                                                </div>
                                                <div className="font-medium truncate">{order.destination_city}, {order.destination_state} {order.destination_zip}</div>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipment Details Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Freight Type & Pickup Date Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Type</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {freightTypeMapping[order.freight_type] || order.freight_type}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Pickup</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {order.due_date ? formatDate(order.due_date) : 'Not set'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipment Items */}
                                    <div className="flex items-start space-x-2">
                                        <Package className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Load Details</div>
                                            {renderAdditionalDetails(order)}
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Section */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide font-medium mb-1">Order Value</div>
                                            {order.price ? (
                                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                                    ${order.price.toLocaleString()}
                                                    {order.deposit && (
                                                        <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                                                            (+${order.deposit} deposit)
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-500">Price pending</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Actions */}
                                {expandedOrderId === order.id && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4 animate-in slide-in-from-top duration-200">
                                        {/* Date Management */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
                                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">Schedule Dates</h5>
                                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Load Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={loadDates[order.id] || order.load_date || ''}
                                                        onChange={(e) => handleDateChange(e, order.id, 'load')}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 touch-manipulation"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Delivery Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={deliveryDates[order.id] || order.delivery_date || ''}
                                                        onChange={(e) => handleDateChange(e, order.id, 'delivery')}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 touch-manipulation"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSubmitDates(order.id)}
                                                className="w-full bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 touch-manipulation active:scale-95 transition-transform"
                                            >
                                                Update Dates
                                            </button>
                                        </div>

                                        {/* Primary Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(order);
                                                }}
                                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors touch-manipulation active:scale-95"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                                <span>Edit Order</span>
                                            </button>
                                        </div>

                                        {/* Secondary Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    duplicateQuote(order);
                                                }}
                                                className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors touch-manipulation active:scale-95"
                                            >
                                                <Copy className="w-4 h-4" />
                                                <span>Duplicate</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    reverseQuote(order);
                                                }}
                                                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors touch-manipulation active:scale-95"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Flip Route</span>
                                            </button>
                                        </div>

                                        {/* Admin Controls */}
                                        {isAdmin && (
                                            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                                <button
                                                    onClick={handleMarkAsComplete(order.id)}
                                                    className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors touch-manipulation active:scale-95"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Mark as Complete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderDetailsMobile;
