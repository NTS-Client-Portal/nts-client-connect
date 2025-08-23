import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import SelectTemplate from '@/components/SelectTemplate';
import QuoteFormModal from '@/components/user/forms/QuoteFormModal';
import { 
    ChevronDown, 
    ChevronUp, 
    MapPin, 
    Calendar, 
    Package, 
    DollarSign, 
    Edit3, 
    Truck, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    X,
    Archive
} from 'lucide-react';

interface QuoteDetailsMobileProps {
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>, quoteId: number) => void;
    getStatusClasses: (status: string) => string;
    formatDate: (date: string) => string;
    archiveQuote: (id: number) => Promise<void>;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (quoteId: number) => void;
    handleRespond: (quoteId: number, price: number) => void;
    isAdmin: boolean;
    isUser: boolean;
    setShowPriceInput: React.Dispatch<React.SetStateAction<number | null>>;
    showPriceInput: number | null;
    priceInput: string;
    setPriceInput: React.Dispatch<React.SetStateAction<string>>;
    handleRejectClick: (id: number) => void;
}

const QuoteDetailsMobile: React.FC<QuoteDetailsMobileProps> = ({
    quotes,
    handleStatusChange,
    getStatusClasses,
    formatDate,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    handleRejectClick,
    isAdmin,
    isUser,
    setShowPriceInput,
    showPriceInput,
    priceInput,
    setPriceInput,
}) => {
    const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);
    const [depositInput, setDepositInput] = useState('');
    const [loading, setLoading] = useState<boolean>(true);
    const session = useSession();
    const [companyId, setCompanyId] = useState<string | null>(null);
    const profiles = [];

    useEffect(() => {
        const fetchCompanyId = async () => {
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }

            try {
                if (isUser) {
                    // For shippers, fetch company_id from profiles table
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('company_id')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error('Error fetching company ID from profiles:', error.message);
                    } else {
                        setCompanyId(data?.company_id || null);
                    }
                } else {
                    // For sales reps/brokers, fetch company_id from nts_users table
                    const { data, error } = await supabase
                        .from('nts_users')
                        .select('company_id')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error('Error fetching company ID from nts_users:', error.message);
                    } else {
                        setCompanyId(data?.company_id || null);
                    }
                }
            } catch (err) {
                console.error('Unexpected error fetching company ID:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyId();
    }, [session, supabase]);

    useEffect(() => {
        if (quotes.length > 0) {
            setLoading(false);
        } else {
            // Simulate a delay for loading state
            const timer = setTimeout(() => setLoading(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [quotes]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'in progress':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'priced':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'need more info':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'in progress':
                return <Clock className="w-3 h-3" />;
            case 'priced':
                return <CheckCircle className="w-3 h-3" />;
            case 'need more info':
                return <AlertCircle className="w-3 h-3" />;
            case 'cancelled':
                return <X className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    const handlePriceSubmit = async (e, quoteId) => {
        e.preventDefault();
        const price = parseFloat(priceInput);
        const deposit = parseFloat(depositInput);
        const totalPrice = price + deposit;

        const { error } = await supabase
            .from('shippingquotes')
            .update({ price, deposit, total_price: totalPrice })
            .eq('id', quoteId);

        if (error) {
            console.error('Error updating price:', error.message);
        } else {
            setShowPriceInput(null);
            setPriceInput('');
            setDepositInput('');
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-safe">
            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ntsLightBlue"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading quotes...</span>
                </div>
            ) : quotes.length === 0 ? (
                <div className='flex flex-col h-full w-full items-center justify-center gap-6 p-6 bg-white dark:bg-gray-800 m-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                    <div className="text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No quotes yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">Get started by creating your first quote request</p>
                    </div>
                    <QuoteFormModal
                        session={session}
                        profiles={profiles}
                        companyId={companyId}
                        userType="shipper"
                    />
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
                                        <div className="bg-ntsBlue text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                            #{quote.id}
                                        </div>
                                        {isAdmin && quote.brokers_status && (
                                            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(quote.brokers_status)}`}>
                                                {getStatusIcon(quote.brokers_status)}
                                                <span className="hidden xs:inline">{quote.brokers_status}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}
                                        className="flex items-center text-ntsLightBlue font-medium text-sm touch-manipulation active:scale-95 transition-transform"
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
                                        <MapPin className="w-5 h-5 text-ntsLightBlue mt-0.5 flex-shrink-0" />
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
                                    {/* Freight Type & Date Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Truck className="w-4 h-4 text-ntsLightBlue flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Type</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{quote.freight_type}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-ntsLightBlue flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">Date</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{formatDate(quote.due_date)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipment Items */}
                                    <div className="flex items-start space-x-2">
                                        <Package className="w-4 h-4 text-ntsLightBlue mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Items</div>
                                            <div className="flex flex-wrap gap-1">
                                                {Array.isArray(quote.shipment_items) ? quote.shipment_items.map((item: any, index) => (
                                                    <div key={index}>
                                                        {item.container_length && item.container_type && (
                                                            <span className="inline-block bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                                                                {item.container_length}' {item.container_type}
                                                            </span>
                                                        )}
                                                        {item.year && item.make && item.model && (
                                                            <span className="inline-block bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                                                                {item.year} {item.make} {item.model}
                                                            </span>
                                                        )}
                                                    </div>
                                                )) : (
                                                    <div>
                                                        {quote.container_length && quote.container_type && (
                                                            <span className="inline-block bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                                                                {quote.container_length}' {quote.container_type}
                                                            </span>
                                                        )}
                                                        {quote.year && quote.make && quote.model && (
                                                            <span className="inline-block bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                                                                {quote.year} {quote.make} {quote.model}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {quote.notes && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                        <div className="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide font-medium mb-1">Notes</div>
                                        <div className="text-sm text-blue-800 dark:text-blue-200">{quote.notes}</div>
                                    </div>
                                )}

                                {/* Pricing Section */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            {isAdmin ? (
                                                showPriceInput === quote.id ? (
                                                    <form onSubmit={(e) => handlePriceSubmit(e, quote.id)} className="space-y-3">
                                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                    Carrier Pay
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={priceInput}
                                                                    onChange={(e) => setPriceInput(e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 touch-manipulation"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                    Deposit
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={depositInput}
                                                                    onChange={(e) => setDepositInput(e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 touch-manipulation"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                type="submit" 
                                                                className="flex-1 bg-green-600 text-white px-3 py-2.5 rounded-md text-sm font-medium hover:bg-green-700 touch-manipulation active:scale-95 transition-transform"
                                                            >
                                                                Submit Price
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setShowPriceInput(null)}
                                                                className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation active:scale-95 transition-transform"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <div>
                                                        <div className="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide font-medium mb-1">Quote Price</div>
                                                        {quote.price ? (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xl font-bold text-green-800 dark:text-green-200">
                                                                    ${quote.price.toLocaleString()}
                                                                </span>
                                                                <button
                                                                    onClick={() => setShowPriceInput(quote.id)}
                                                                    className="text-ntsLightBlue text-sm font-medium underline touch-manipulation active:opacity-70"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setShowPriceInput(quote.id)}
                                                                className="w-full bg-ntsLightBlue text-white px-3 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 touch-manipulation active:scale-95 transition-transform"
                                                            >
                                                                Set Price
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            ) : (
                                                <div>
                                                    <div className="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide font-medium mb-1">Quote Price</div>
                                                    {quote.price ? (
                                                        <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                                                            ${quote.price.toLocaleString()}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                                                                Awaiting price quote
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Actions */}
                                {expandedQuoteId === quote.id && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4 animate-in slide-in-from-top duration-200">
                                        {/* Primary Actions */}
                                        <div className="space-y-3">
                                            {quote.price && (
                                                <button
                                                    onClick={() => handleCreateOrderClick(quote.id)}
                                                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors touch-manipulation active:scale-95"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Create Order</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(quote)}
                                                className="w-full flex items-center justify-center space-x-2 bg-ntsLightBlue text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors touch-manipulation active:scale-95"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                                <span>Edit Quote</span>
                                            </button>
                                        </div>

                                        {/* Admin Controls */}
                                        {isAdmin && (
                                            <div className="space-y-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Broker Status
                                                    </label>
                                                    <select
                                                        value={quote.brokers_status || ''}
                                                        onChange={(e) => handleStatusChange(e, quote.id)}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2.5 text-sm bg-white dark:bg-gray-800 touch-manipulation"
                                                        aria-label="Broker Status"
                                                        title="Broker Status"
                                                    >
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Need More Info">Need More Info</option>
                                                        <option value="Priced">Priced</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                                <SelectTemplate quoteId={quote.id} />
                                            </div>
                                        )}

                                        {/* Secondary Actions */}
                                        <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                                            {quote.price && (
                                                <button
                                                    onClick={() => handleRejectClick(quote.id)}
                                                    className="w-full text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium py-2 touch-manipulation active:opacity-70"
                                                >
                                                    Reject Quote
                                                </button>
                                            )}
                                            <button
                                                onClick={() => archiveQuote(quote.id)}
                                                className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium py-2 touch-manipulation active:opacity-70"
                                            >
                                                <Archive className="w-4 h-4" />
                                                <span>Archive Quote</span>
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

export default QuoteDetailsMobile;