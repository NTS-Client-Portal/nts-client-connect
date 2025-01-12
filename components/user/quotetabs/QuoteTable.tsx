import React, { useState, useMemo, useEffect } from 'react';
import EditHistory from '../../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import OrderFormModal from './OrderFormModal';
import { generateAndUploadDocx, replaceShortcodes } from "@/components/GenerateDocx";
import SelectTemplate from '@/components/SelectTemplate';

interface QuoteTableProps {
    sortConfig: { column: string; order: string };
    handleSort: (column: string, order: string) => void;
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    activeTab: string;
    quoteToEdit: Database['public']['Tables']['shippingquotes']['Row'] | null;
    quote: Database['public']['Tables']['shippingquotes']['Row'] | null;
    companyId: string;
    editHistory: Database['public']['Tables']['edit_history']['Row'][];
    fetchEditHistory: (companyId: string) => void;
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveQuote: (id: number) => Promise<void>;
    handleCreateOrderClick: (quoteId: number) => void;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleRespond: (quoteId: number, price: number) => void;
    isAdmin: boolean;
    isUser: boolean;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleRejectClick: (id: number) => void;
}

const columnDisplayNames: { [key: string]: string } = {
    id: 'ID',
    freight_type: 'Load Details',
    origin_destination: 'Origin/Destination',
    due_date: 'Date',
    price: 'Price',
};

const QuoteTable: React.FC<QuoteTableProps> = ({
    sortConfig,
    handleSort,
    quotes,
    setActiveTab,
    activeTab,
    handleRejectClick,
    editHistory,
    expandedRow,
    handleRowClick,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    isAdmin,
    isUser,
    duplicateQuote,
    reverseQuote,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [quotesState, setQuotes] = useState(quotes);
    const [quote, setQuote] = useState<Database['public']['Tables']['shippingquotes']['Row'] | null>(null);
    const rowsPerPage = 10;
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');
    const [showPriceInput, setShowPriceInput] = useState<number | null>(null);
    const [carrierPayInput, setCarrierPayInput] = useState('');
    const [depositInput, setDepositInput] = useState('');

    const filteredQuotes = useMemo(() => {
        let sortedQuotes = [...quotes];

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
    }, [searchTerm, quotes, sortConfig]);

    const currentRows = filteredQuotes.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredQuotes.length / rowsPerPage);


    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    


    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, quoteId: number) => {
        const newStatus = e.target.value;

        // Update the status in the database
        const { error } = await supabase
            .from('shippingquotes')
            .update({ brokers_status: newStatus })
            .eq('id', quoteId);

        if (error) {
            console.error('Error updating status:', error.message);
        }
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'In Progress':
                return 'bg-blue-50 text-blue-700';
            case 'Need More Info':
                return 'bg-amber-50 text-amber-700';
            case 'Priced':
                return 'bg-green-50 text-green-700';
            case 'Cancelled':
                return 'bg-red-50 text-red-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*');

        if (error) {
            console.error('Error fetching quotes:', error.message);
        } else {
            setQuotes(data);
        }
    };

    const handlePriceSubmit = async (e: React.FormEvent<HTMLFormElement>, quoteId: number) => {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            carrierPay: HTMLInputElement;
            deposit: HTMLInputElement;
        };
        const carrierPay = parseFloat(target.carrierPay.value);
        const deposit = parseFloat(target.deposit.value);
        const totalPrice = carrierPay + deposit;

        const { error: updateError } = await supabase
            .from('shippingquotes')
            .update({ carrier_pay: carrierPay, deposit, price: totalPrice })
            .eq('id', quoteId);

        if (updateError) {
            console.error('Error updating price:', updateError.message);
            return;
        }

        // Fetch the updated quote data
        const { data: updatedQuote, error: fetchError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError) {
            console.error('Error fetching updated quote:', fetchError.message);
            return;
        }

        // Fetch the template content
        const { data: templateData, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('context', 'quote')
            .single();

        if (templateError) {
            console.error('Error fetching template:', templateError.message);
            return;
        }

        const content = replaceShortcodes(templateData.content, { quote: updatedQuote });
        const title = templateData.title || 'Quote Confirmation';
        const templateId = templateData.id; // Get the template ID

        await generateAndUploadDocx(updatedQuote, content, title, templateId); // Pass the template ID

        // Save the document metadata with the template ID
        const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .insert({
                user_id: updatedQuote.user_id,
                title,
                description: 'Quote Confirmation Document',
                file_name: `${title}.docx`,
                file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                file_url: `path/to/${title}.docx`,
                template_id: templateId, // Include the template ID
            })
            .select()
            .single();

        if (documentError) {
            console.error('Error saving document metadata:', documentError.message);
        } else {
            fetchQuotes();
            setShowPriceInput(null);
            setCarrierPayInput('');
            setDepositInput('');
        }
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

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
            <table className="min-w-full place-content-center divide-zinc-200 border">
            <thead className="bg-ntsBlue border-2 border-t-orange-500 text-zinc-50  top-0 w-fit">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs text-nowrap font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider">
                            Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="freight_type" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="origin_destination" sortOrder={sortConfig.column === 'origin_destination' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            <TableHeaderSort column="due_date" sortOrder={sortConfig.column === 'due_date' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider">
                            <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 w-fit">
                    {currentRows.map((quote, index) => (
                        <React.Fragment key={quote.id}>
                            <tr onClick={() => handleRowClick(quote.id)}
                                className={`cursor-pointer mb-4 w-max ${index % 2 === 0 ? 'bg-white h-fit w-full' : 'bg-gray-100'} hover:bg-gray-200 transition-colors duration-200`}
                            >
                                <td
                                    onClick={() => handleRowClick(quote.id)}
                                    className="px-6 py-3 w-[30px] whitespace-nowrap text-sm font-medium text-ntsLightBlue underline border border-gray-200"
                                >
                                    {quote.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200">{quote.notes}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">
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
                                                            <span className='text-normal text-zinc-900 text-start w-min'>{`${quote.year} ${quote.make} ${quote.model}`}</span><br />
                                                            <span className='text-normal text-zinc-900 text-start w-min'>
                                                                {`${quote.length} ${quote.length_unit} x ${quote.width} ${quote.width_unit} x ${quote.height} ${quote.height_unit}, 
                                                                ${quote.weight} ${quote.weight_unit}`}
                                                                </span>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <div className='text-start pt-1 w-min'>
                                            <span className='font-semibold text-xs text-gray-700 text-start w-min'>Freight Type:</span>
                                            <span className='text-xs text-zinc-900 text-start px-1 w-min'>{quote.freight_type}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`)}&destination=${encodeURIComponent(`${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline"
                                    >
                                        {quote.origin_city}, {quote.origin_state} {quote.origin_zip} / <br />
                                        {quote.destination_city}, {quote.destination_state} {quote.destination_zip} <br /> [Map It]
                                    </a>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 border border-gray-200">{quote.due_date}</td>

                                <td>
                                {isAdmin ? (
                                    showPriceInput === quote.id ? (
                                        <form onSubmit={(e) => handlePriceSubmit(e, quote.id)}>
                                            <div className='flex flex-col items-center gap-1'>
                                                <span className='flex flex-col'>
                                                    <label className='text-sm font-semibold text-ntsBlue'>Carrier Pay:</label>
                                                    <input
                                                        type="number"
                                                        name="carrierPay"
                                                        value={carrierPayInput}
                                                        onChange={(e) => setCarrierPayInput(e.target.value)}
                                                        placeholder="Enter price"
                                                        className="border border-gray-300 rounded-md p-1"
                                                    />
                                                </span>
                                                <span className='flex flex-col'>
                                                    <label className='text-sm font-semibold text-emerald-600'>Deposit:</label>
                                                    <input
                                                        type="number"
                                                        name="deposit"
                                                        value={depositInput}
                                                        onChange={(e) => setDepositInput(e.target.value)}
                                                        placeholder="Enter deposit"
                                                        className="border border-gray-300 rounded-md p-1"
                                                    />
                                                </span>
                                            </div>
                                            <button type="submit" className="pl-6 text-ntsLightBlue text-center text-sm font-semibold underline">
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
                                                            Edit Quote
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
                                                    <div className='flex flex-col items-center justify-between'>
                                                        <span className='text-emerald-500 font-semibold text-base underline'>{`$${quote.price}`}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className='flex justify-center italic text-gray-950 text-base font-normal'>Pending</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="pl-3 py-3 whitespace-nowrap text-left text-sm text-gray-500 border border-gray-200 w-80">
                                    <div className='flex flex-col gap-1 justify-start text-left items-start'>
                                        <div className='flex gap-2 items-center'>
                                            {quote.price ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCreateOrderClick(quote.id);
                                                    }}
                                                    className="text-ntsLightBlue font-medium underline"
                                                >
                                                    Create Order
                                                </button>
                                            ) : null}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(quote);
                                                }}
                                                className="text-ntsLightBlue font-medium underline"
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
                            <button onClick={() => archiveQuote(quote.id)} className="text-red-500 mt-3 font-semibold underline text-sm">
                                Archive Quote
                            </button>
                        </>
                    ) : (
                        <span><strong>Status: </strong>{quote.brokers_status ? quote.brokers_status : 'Pending'}</span>
                    )}
                    {isUser && quote.price ? (
                        <div className='flex flex-col gap-2 items-center justify-between'>
                            <button onClick={() => handleRejectClick(quote.id)} className='text-red-500 underline font-light'>Reject Quote</button>
                        </div>
                    ) : null}
                                    </div>
                                </td>
                            </tr>
                            {expandedRow === quote.id && (
                                <tr className='my-4'>
                                    <td colSpan={7}>
                                        <div className="p-4 bg-white border-x border-b border-ntsLightBlue/30 rounded-b-md">
                                            <div className="flex gap-1">
                                                <button
                                                    className={`px-4 py-2 ${activeTab === 'quotes' ? 'bg-gray-200 border-t border-ntsLightBlue' : 'bg-gray-200'}`}
                                                    onClick={() => setActiveTab('quotes')}
                                                >
                                                    Quote Details
                                                </button>
                                                <button
                                                    className={`px-4 py-2 ${activeTab === 'editHistory' ? 'bg-gray-200 border-t border-ntsLightBlue' : 'bg-gray-200'}`}
                                                    onClick={() => setActiveTab('editHistory')}
                                                >
                                                    Edit History
                                                </button>
                                            </div>
                                            {activeTab === 'quotes' && (
                                                <div className='border border-gray-200 p-6 h-full'>
                                                    {renderAdditionalDetails(quote)}
                                                    <div className='flex gap-2 items-center h-full'>
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateQuote(quote); }} className="body-btn ml-2">
                                                            Duplicate Quote
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); reverseQuote(quote); }} className="body-btn ml-2">
                                                            Flip Route Duplicate
                                                        </button>
                                                    </div>
                                                    <div className='flex gap-2 items-center'>
                                                        <button onClick={() => handleEditClick(quote)} className="text-ntsLightBlue mt-3 font-semibold text-base underline h-full">
                                                            Edit Quote
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {activeTab === 'editHistory' && (
                                                <div className="max-h-96">
                                                    <EditHistory quoteId={quote.id} searchTerm="" searchColumn="id" editHistory={editHistory} />
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
            <OrderFormModal
                isOpen={false} // Replace with actual state or prop
                onClose={() => { }} // Replace with actual function
                onSubmit={() => { }} // Replace with actual function
                quote={null} // Replace with actual quote data
            />
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

export default QuoteTable;