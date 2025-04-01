import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import SelectTemplate from '@/components/SelectTemplate';
import QuoteFormModal from '@/components/user/forms/QuoteFormModal';

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
    setShowPriceInput: (id: number | null) => void;
    showPriceInput: number | null;
    priceInput: string;
    setPriceInput: (value: string) => void;
    handleRejectClick: (quoteId: number) => void;
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
                // Fetch the company_id from the profiles table
                const { data, error } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching company ID:', error.message);
                } else {
                    setCompanyId(data?.company_id || null);
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
        <div className="mx-auto overflow-y-hidden h-full w-full">
            {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
            ) : quotes.length === 0 ? (
                <>
                    <div className='flex flex-col h-full w-full items-center justify-start gap-4 p-4 border border-gray-500'>
                        <div>
                            <p className="text-center text-gray-500">No quotes available yet.</p>
                        </div>
                        <div className='flex justify-center'>
                            <QuoteFormModal
                                session={session}
                                profiles={profiles}
                                companyId={companyId}
                                userType="shipper"
                            />
                        </div>
                    </div>
                </>
            ) : (
                quotes.map((quote) => (
                    <div key={quote.id} className="bg-white dark:bg-zinc-800 text-ntsBlue shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-ntsBlue">Quote# {quote.id}</div>
                            <button
                                onClick={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}
                                className="text-ntsLightBlue font-semibold underline"
                            >
                                {expandedQuoteId === quote.id ? 'Collapse' : 'Actions'}
                            </button>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="text-sm text-gray-500 mb-2">{quote.notes}</div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-ntsBlue">Origin/Destination</div>
                            <div className="text-sm font-medium text-zinc-900">
                                <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`)}&destination=${encodeURIComponent(`${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {quote.origin_city}, {quote.origin_state} {quote.origin_zip} / <br />
                                    {quote.destination_city}, {quote.destination_state} {quote.destination_zip}
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-medium text-zinc-900">
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
                                                <span className='font-semibold text-sm text-text-zinc-900 p-0 w-min'>Shipment Item {index + 1}:</span>
                                                <span className='text-base text-zinc-900 p-0 w-min'>{`${item.year} ${item.make} ${item.model}`}</span>
                                            </span>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-ntsBlue">Freight Type</div>
                            <div className="text-sm font-medium text-zinc-900">{quote.freight_type}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-ntsBlue">Shipping Date</div>
                            <div className="text-sm font-medium text-zinc-900">{formatDate(quote.due_date)}</div>
                        </div>
                        <div>
                            {isAdmin ? (
                                showPriceInput === quote.id ? (
                                    <form onSubmit={(e) => handlePriceSubmit(e, quote.id)}>
                                        <div className='flex flex-col items-center gap-1'>
                                            <span className='flex flex-col'>
                                                <label className='text-sm font-semibold text-ntsBlue'>Carrier Pay:</label>
                                                <input
                                                    type="number"
                                                    value={priceInput}
                                                    onChange={(e) => setPriceInput(e.target.value)}
                                                    placeholder="Enter price"
                                                    className="border border-gray-300 rounded-md p-1"
                                                />
                                            </span>
                                            <span className='flex flex-col'>
                                                <label className='text-sm font-semibold text-emerald-600'>Deposit:</label>
                                                <input
                                                    type="number"
                                                    value={depositInput}
                                                    onChange={(e) => setDepositInput(e.target.value)}
                                                    placeholder="Enter deposit"
                                                    className="border border-gray-300 rounded-md p-1"
                                                />
                                            </span>
                                        </div>
                                        <button type="submit" className="ml-2 text-ntsLightBlue text-sm font-semibold underline">
                                            Submit
                                        </button>
                                    </form>
                                ) : (
                                    <div className='flex justify-center gap-1'>
                                        {quote.price ? (
                                            <>
                                                <span>{`$${quote.price}`}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowPriceInput(quote.id);
                                                    }}
                                                    className="ml-2 text-ntsLightBlue font-medium underline"
                                                >
                                                    Edit Price
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowPriceInput(quote.id);
                                                }}
                                                className="text-ntsLightBlue font-medium underline"
                                            >
                                                Price Quote Request
                                            </button>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div>
                                    {quote.price ? (
                                        <>
                                            <div className='flex items-center gap-1 justify-start'>
                                                <div className="font-extrabold text-base text-ntsBlue">Rate:</div>
                                                <span className='text-emerald-500 font-semibold text-base underline'>{`$${quote.price}`}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <span className='flex justify-center italic text-ntsBlue text-base font-normal'>Pending</span>
                                    )}
                                </div>
                            )}
                        </div>
                        {expandedQuoteId === quote.id && (
                            <div className="mt-1">
                                <div className="flex flex-col gap-1 justify-start text-left items-start">
                                    <div className="flex flex-col justify-start gap-1 items-start">
                                        {quote.price ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCreateOrderClick(quote.id);
                                                }}
                                                className="text-green-600 font-semibold underline"
                                            >
                                                Create Order
                                            </button>
                                        ) : null}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(quote);
                                            }}
                                            className="text-ntsLightBlue font-semibold underline"
                                        >
                                            Edit Quote
                                        </button>
                                    </div>
                                    {isAdmin ? (
                                        <>
                                            <select
                                                value={quote.brokers_status}
                                                onChange={(e) => handleStatusChange(e, quote.id)}
                                                className={`bg-white dark:bg-zinc-800 dark:text-white border border-gray-300 rounded-md ${getStatusClasses(quote.brokers_status)}`}>
                                                <option value="In Progress" className={getStatusClasses('In Progress')}>In Progress</option>
                                                <option value="Need More Info" className={getStatusClasses('Need More Info')}>Need More Info</option>
                                                <option value="Priced" className={getStatusClasses('Priced')}>Priced</option>
                                                <option value="Cancelled" className={getStatusClasses('Cancelled')}>Cancelled</option>
                                            </select>
                                            <SelectTemplate quoteId={quote.id} />
                                        </>
                                    ) : (
                                        <>
                                        </>
                                    )}
                                    {quote.price ? (
                                        <>
                                            <div className='flex flex-col gap-2 items-center justify-between'>
                                                <button onClick={() => handleRejectClick(quote.id)} className='text-red-500 underline font-light'>Reject Quote</button>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => archiveQuote(quote.id)}
                                        className="text-zinc-800 font-light text-sm underline"
                                    >
                                        Archive Quote
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default QuoteDetailsMobile;