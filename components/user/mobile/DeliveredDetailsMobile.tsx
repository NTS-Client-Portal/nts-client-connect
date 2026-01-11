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
    CheckCircle,
    Copy,
    RotateCcw,
    Clock
} from 'lucide-react';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface DeliveredDetailsMobileProps {
    quotes: ShippingQuotesRow[];
    duplicateQuote: (quote: ShippingQuotesRow) => void;
    reverseQuote: (quote: ShippingQuotesRow) => void;
    formatDate: (date: string) => string;
    getStatusClasses: (status: string) => string;
}

const DeliveredDetailsMobile: React.FC<DeliveredDetailsMobileProps> = ({
    quotes,
    duplicateQuote,
    reverseQuote,
    formatDate,
    getStatusClasses,
}) => {
    const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (quotes.length > 0) {
            setLoading(false);
        }
    }, [quotes]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'invoiced':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return <CheckCircle className="w-3 h-3" />;
            case 'completed':
                return <CheckCircle className="w-3 h-3" />;
            case 'invoiced':
                return <DollarSign className="w-3 h-3" />;
            default:
                return <CheckCircle className="w-3 h-3" />;
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-safe">
            {loading ? (
                <div className="flex items-center justify-center min-h-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading delivered orders...</span>
                </div>
            ) : quotes.length === 0 ? (
                <div className='flex flex-col h-full w-full items-center justify-center gap-6 p-6 bg-white dark:bg-gray-800 m-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No delivered orders</h3>
                        <p className="text-gray-600 dark:text-gray-400">Completed orders will appear here</p>
                    </div>
                </div>
            ) : (
                <div className="p-3 space-y-3 pb-6">
                    {quotes.map((quote) => (
                        <div 
                            key={quote.id} 
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-200 hover:shadow-md"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                            #{quote.id}
                                        </div>
                                        {quote.brokers_status && (
                                            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(quote.brokers_status)}`}>
                                                {getStatusIcon(quote.brokers_status)}
                                                <span className="hidden xs:inline">{quote.brokers_status}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}
                                        className="flex items-center text-blue-600 font-medium text-sm touch-manipulation active:scale-95 transition-transform"
                                    >
                                        {expandedQuoteId === quote.id ? (
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
                                        <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Route</h4>
                                            <a 
                                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`)}&destination=${encodeURIComponent(`${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm touch-manipulation active:opacity-70"
                                            >
                                                <div className="font-medium truncate">{quote.origin_city}, {quote.origin_state} {quote.origin_zip}</div>
                                                <div className="text-gray-600 dark:text-gray-400 text-xs my-1 flex items-center">
                                                    <div className="w-4 h-0.5 bg-gray-400 rounded mr-1"></div>
                                                    <div className="text-lg">→</div>
                                                    <div className="w-4 h-0.5 bg-gray-400 rounded ml-1"></div>
                                                </div>
                                                <div className="font-medium truncate">{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipment Details Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Freight Type & Delivered Date Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Type</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {freightTypeMapping[quote.freight_type] || quote.freight_type}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Delivered</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {quote.due_date ? formatDate(quote.due_date) : 'Not recorded'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipment Items */}
                                    <div className="flex items-start space-x-2">
                                        <Package className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Load Details</div>
                                            {renderAdditionalDetails(quote)}
                                        </div>
                                    </div>

                                    {/* Delivery Timeline */}
                                    {(quote.load_date || quote.delivery_date) && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                            <div className="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide font-medium mb-2">Timeline</div>
                                            <div className="space-y-1">
                                                {quote.load_date && (
                                                    <div className="flex items-center text-sm">
                                                        <Package className="w-3 h-3 text-blue-600 mr-2" />
                                                        <span className="text-blue-800 dark:text-blue-200">Picked up: {formatDate(quote.load_date)}</span>
                                                    </div>
                                                )}
                                                {quote.delivery_date && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircle className="w-3 h-3 text-blue-600 mr-2" />
                                                        <span className="text-blue-800 dark:text-blue-200">Completed: {formatDate(quote.delivery_date)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Pricing Section */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <DollarSign className="w-5 h-5 text-green-600 shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide font-medium mb-1">Final Amount</div>
                                            {quote.price ? (
                                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                                    ${quote.price.toLocaleString()}
                                                    {quote.deposit && (
                                                        <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                                                            (+${quote.deposit} deposit)
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-500">Amount not recorded</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Actions */}
                                {expandedQuoteId === quote.id && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3 animate-in slide-in-from-top duration-200">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    duplicateQuote(quote);
                                                }}
                                                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors touch-manipulation active:scale-95"
                                            >
                                                <Copy className="w-4 h-4" />
                                                <span>Duplicate</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    reverseQuote(quote);
                                                }}
                                                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors touch-manipulation active:scale-95"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Flip Route</span>
                                            </button>
                                        </div>
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

export default DeliveredDetailsMobile;
