import React, { useState, useMemo, useEffect } from 'react';
import EditHistory from '../../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import OrderFormModal from './OrderFormModal';
import { generateAndUploadDocx, replaceShortcodes } from "@/components/GenerateDocx";
import SelectTemplate from '@/components/SelectTemplate';
import QuoteFormModal from '@/components/user/forms/QuoteFormModal';
import { 
    Search, 
    Filter, 
    Package, 
    MapPin, 
    Calendar, 
    Truck, 
    DollarSign,
    Edit,
    Copy,
    RotateCcw,
    Eye,
    X,
    CheckCircle,
    XCircle,
    Clock,
    Building2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

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
    freight_type: 'Freight Details',
    origin_destination: 'Origin/Destination',
    due_date: 'Date',
    price: 'Price',
    created_at: 'Created At',
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
    const rowsPerPage = 10;
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');
    const [showPriceInput, setShowPriceInput] = useState<number | null>(null);
    const [carrierPayInput, setCarrierPayInput] = useState('');
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
                    quote.created_at,
                    quote.price,
                    ...shipmentItems?.map((item: {
                        year: string;
                        make: string;
                        model: string;
                        container_length: string; container_type: string,
                        weight_per_pallet_unit: string, load_description: string,
                    }) => `${item.year} ${item.make} ${item.model} ${item.container_length} ft ${item.container_type} ${item.load_description} ${item.load_description}`) || []
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
                return 'modern-badge-info';
            case 'Need More Info':
                return 'modern-badge-warning';
            case 'Priced':
                return 'modern-badge-success';
            case 'Cancelled':
                return 'modern-badge-error';
            default:
                return 'modern-badge-info';
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
            quotePrice: HTMLInputElement;
        };
        const quotePrice = parseFloat(target.quotePrice.value);

        const { error: updateError } = await supabase
            .from('shippingquotes')
            .update({ price: quotePrice })
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
            <button onClick={handleSortClick} className="flex items-center hover:text-blue-200 transition-colors">
                {columnDisplayNames[column] || column}
                {sortOrder ? (
                    // Active sorting - always up arrow, different colors for asc/desc
                    <svg 
                        className={`w-4 h-4 ml-1 ${sortOrder === 'asc' ? 'text-blue-300' : 'text-yellow-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 6l-6 6h4v6h4v-6h4l-6-6z"/>
                    </svg>
                ) : (
                    // Not sorted - subtle gray arrow
                    <svg className="w-4 h-4 ml-1 text-gray-400 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6l-6 6h4v6h4v-6h4l-6-6z"/>
                    </svg>
                )}
                {sortOrder && (
                    <span className={`ml-1 text-xs ${sortOrder === 'asc' ? 'text-blue-300' : 'text-yellow-300'}`}>
                        {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="w-full p-2 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Quote Requests
                    </h2>
                    <p className="text-gray-600 mt-1">Manage shipping quote requests and pricing</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    {filteredQuotes.length} Quotes
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="flex flex-row flex-nowrap items-center gap-3">
                                        <div className="flex items-center gap-2 flex-shrink-0">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            aria-label="Filter by column"
                            value={searchColumn}
                            onChange={(e) => setSearchColumn(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="id">Quote ID</option>
                            <option value="freight_type">Freight Type</option>
                            <option value="origin_city">Origin City</option>
                            <option value="destination_city">Destination City</option>
                            <option value="due_date">Date</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search quotes..."
                            className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading quotes...</p>
                </div>
            ) : quotes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first quote</p>
                    <QuoteFormModal
                        session={session}
                        profiles={profiles}
                        companyId={companyId}
                        userType="shipper"
                    />
                </div>
            ) : (
                <>
                    {/* Mobile/Tablet Card View - Hidden on Desktop */}
                    <div className="lg:hidden space-y-4">
                        {currentRows.map(quote => (
                            <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 cursor-pointer" onClick={() => handleRowClick(quote.id)}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Package className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Quote #{quote.id}</h3>
                                                <p className="text-sm text-gray-500">{formatDate(quote.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {quote.price ? (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                    <span className="text-lg font-semibold text-green-600">${quote.price}</span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Load Details</h4>
                                            {Array.isArray(quote.shipment_items) && quote.shipment_items.length > 0 ? (
                                                quote.shipment_items.map((item: any, idx) => (
                                                    <div key={idx} className="text-sm text-gray-600 mb-1">
                                                        {[
                                                            item.year,
                                                            item.make,
                                                            item.model,
                                                            item.container_length && `${item.container_length}ft`,
                                                            item.container_type,
                                                            item.load_description
                                                        ].filter(Boolean).join(' ')}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-600">{freightTypeMapping[quote.freight_type?.toLowerCase()] || quote.freight_type}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Route</h4>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-gray-600">{quote.origin_city}, {quote.origin_state}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                    <span className="text-sm text-gray-600">{quote.destination_city}, {quote.destination_state}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{formatDate(quote.due_date)}</span>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(quote.brokers_status || 'In Progress')}`}>
                                                {quote.brokers_status || 'In Progress'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {expandedRow === quote.id && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <div className="space-y-4">
                                            <div className="flex gap-2 border-b border-gray-200">
                                                <button
                                                    className={`modern-btn px-4 py-2 text-sm font-medium ${activeTab === 'quotes' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
                                                    onClick={() => setActiveTab('quotes')}
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    className={`modern-btn px-4 py-2 text-sm font-medium ${activeTab === 'editHistory' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
                                                    onClick={() => setActiveTab('editHistory')}
                                                >
                                                    History
                                                </button>
                                            </div>
                                            {activeTab === 'quotes' && (
                                                <div className="modern-card p-4">
                                                    {renderAdditionalDetails(quote)}
                                                    <div className="flex gap-2 mt-4">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); duplicateQuote(quote); }} 
                                                            className="modern-btn-outline flex-1"
                                                        >
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Duplicate
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); reverseQuote(quote); }} 
                                                            className="modern-btn-outline flex-1"
                                                        >
                                                            <RotateCcw className="w-4 h-4 mr-2" />
                                                            Flip Route
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {activeTab === 'editHistory' && (
                                                <div className="modern-card p-4 max-h-64 overflow-y-auto modern-scrollbar">
                                                    <EditHistory quoteId={quote.id} searchTerm="" searchColumn="id" editHistory={editHistory} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(quote); }} 
                                            className="modern-btn-primary flex-1"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Quote
                                        </button>
                                        {quote.price && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleCreateOrderClick(quote.id); }} 
                                                className="modern-btn bg-green-600 hover:bg-green-700 text-white flex-1"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Create Order
                                            </button>
                                        )}
                                        {isUser && quote.price && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRejectClick(quote.id); }}
                                                className="modern-btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                                                aria-label="Reject Quote"
                                                title="Reject Quote"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isAdmin && (
                                        <div className="mt-3 space-y-2">
                                            <select
                                                aria-label="Quote Status"
                                                value={quote.brokers_status}
                                                onChange={(e) => handleStatusChange(e, quote.id)}
                                                className="modern-input w-full"
                                            >
                                                <option value="In Progress">In Progress</option>
                                                <option value="Need More Info">Need More Info</option>
                                                <option value="Priced">Priced</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                            
                                            {showPriceInput === quote.id ? (
                                                <form onSubmit={(e) => handlePriceSubmit(e, quote.id)} className="space-y-2">
                                                    <input
                                                        type="number"
                                                        name="quotePrice"
                                                        value={carrierPayInput}
                                                        onChange={(e) => setCarrierPayInput(e.target.value)}
                                                        placeholder="Enter price"
                                                        className="modern-input w-full"
                                                    />
                                                    <button type="submit" className="modern-btn-primary w-full">
                                                        Submit Quote
                                                    </button>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowPriceInput(quote.id);
                                                    }}
                                                    className="modern-btn bg-green-600 hover:bg-green-700 text-white w-full"
                                                >
                                                    {quote.price ? 'Edit Quote' : 'Price Quote Request'}
                                                </button>
                                            )}
                                            
                                            <SelectTemplate quoteId={quote.id} />
                                            
                                            <button 
                                                onClick={() => archiveQuote(quote.id)} 
                                                className="modern-btn bg-red-600 hover:bg-red-700 text-white w-full"
                                            >
                                                Archive Quote
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View - Grandma-Friendly Design! */}
                    <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200">
                        <table className="modern-table">
                            <thead className="modern-table-header bg-gradient-to-r from-blue-600 text-nowrap to-blue-700 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        <TableHeaderSort column="created_at" sortOrder={sortConfig.column === 'created_at' ? sortConfig.order : null} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        <TableHeaderSort column="freight_type" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
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
                                        Actions
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((quote, index) => (
                                    <React.Fragment key={quote.id}>
                                        <tr 
                                            onClick={() => handleRowClick(quote.id)}
                                            className={`cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}
                                        >
                                            <td className="modern-table-cell font-medium text-blue-600 underline">
                                                #{quote.id}
                                            </td>
                                            <td className="modern-table-cell text-gray-500">
                                                {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="modern-table-cell text-gray-900">
                                                <div className="flex items-start gap-2">
                                                    <Truck className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        {Array.isArray(quote.shipment_items) ? quote.shipment_items.map((item: any, index) => (
                                                            <React.Fragment key={index}>
                                                                {item.container_length && item.container_type && typeof item === 'object' && (
                                                                    <div className='mb-2 last:mb-0'>
                                                                        <span className='font-semibold text-xs text-gray-700 block'>Shipment Item {index + 1}:</span>
                                                                        <span className='text-xs text-zinc-900 block'>{`${item.container_length}ft ${item.container_type}`}</span>
                                                                    </div>
                                                                )}
                                                                {(item.year && item.make && item.model) || (item.auto_year && item.auto_make && item.auto_model) ? (
                                                                    <div className='mb-2 last:mb-0'>
                                                                        <span className='font-semibold text-xs text-gray-700 block'>Shipment Item {index + 1}:</span>
                                                                        <span className='text-xs text-zinc-900 block'>
                                                                            {item.auto_year || item.year} {item.auto_make || item.make} {item.auto_model || item.model}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
                                                                {item.load_description && (
                                                                    <div className='mb-2 last:mb-0'>
                                                                        <span className='font-semibold text-xs text-gray-700 block'>Description:</span>
                                                                        <span className='text-xs text-zinc-900 block'>{item.load_description}</span>
                                                                    </div>
                                                                )}
                                                            </React.Fragment>
                                                        )) : (
                                                            <>
                                                                <div className='space-y-2'>
                                                                    {quote.container_length && quote.container_type && (
                                                                        <div>
                                                                            <span className='font-semibold text-xs text-gray-700 block'>Shipment Item:</span>
                                                                            <span className='text-xs text-zinc-900 block'>{`${quote.container_length}ft ${quote.container_type}`}</span>
                                                                        </div>
                                                                    )}
                                                                    {(quote.year && quote.make && quote.model) || (quote.auto_year && quote.auto_make && quote.auto_model) ? (
                                                                        <div>
                                                                            <span className='font-semibold text-xs text-gray-700 block'>Shipment Item:</span>
                                                                            <span className='text-xs text-zinc-900 block'>
                                                                                {quote.auto_year || quote.year} {quote.auto_make || quote.make} {quote.auto_model || quote.model}
                                                                            </span>
                                                                            {quote.length && quote.width && quote.height && (
                                                                                <span className='text-xs text-zinc-900 block mt-1'>
                                                                                    {`${quote.length} ${quote.length_unit || 'ft'} x ${quote.width} ${quote.width_unit || 'ft'} x ${quote.height} ${quote.height_unit || 'ft'}`}
                                                                                    {quote.weight && `, ${quote.weight} ${quote.weight_unit || 'lbs'}`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : null}
                                                                    {quote.commodity && (
                                                                        <div>
                                                                            <span className='font-semibold text-xs text-gray-700 block'>Load:</span>
                                                                            <span className='text-xs text-zinc-900 block'>{quote.commodity}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {!quote.container_length && !quote.year && !quote.make && !quote.model && !quote.auto_year && !quote.auto_make && !quote.auto_model && !quote.commodity && (
                                                                    <div>
                                                                        <span className='font-semibold text-xs text-gray-700 block'>Freight Type:</span>
                                                                        <span className='text-xs text-zinc-900 block'>{freightTypeMapping[quote.freight_type?.toLowerCase()] || (quote.freight_type ? quote.freight_type.toUpperCase() : 'N/A')}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`)}&destination=${encodeURIComponent(`${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700 underline text-xs"
                                                    >
                                                        <div className="flex flex-col space-y-1">
                                                            <div className="text-xs text-gray-700">
                                                                <span className="font-medium">From:</span> {quote.origin_city}, {quote.origin_state}
                                                            </div>
                                                            <div className="text-xs text-gray-700">
                                                                <span className="font-medium">To:</span> {quote.destination_city}, {quote.destination_state}
                                                            </div>
                                                            <div className="text-xs">View Route</div>
                                                        </div>
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-xs">{formatDate(quote.due_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                {quote.price ? (
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-green-500" />
                                                        <span className="font-semibold text-green-600 text-xs">${quote.price}</span>
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-amber-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-xs">Pending</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditClick(quote);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        <span className="text-xs">Edit</span>
                                                    </button>
                                                    {quote.price && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCreateOrderClick(quote.id);
                                                            }}
                                                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-xs">Order</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
                                                <div className="truncate text-xs" title={quote.notes || ''}>
                                                    {quote.notes}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === quote.id && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                                    <div className="space-y-4">
                                                        <div className="flex gap-2 border-b border-gray-200 pb-2">
                                                            <button
                                                                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'quotes' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                                onClick={() => setActiveTab('quotes')}
                                                            >
                                                                Quote Details
                                                            </button>
                                                            <button
                                                                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'editHistory' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                                onClick={() => setActiveTab('editHistory')}
                                                            >
                                                                Edit History
                                                            </button>
                                                        </div>
                                                        {activeTab === 'quotes' && (
                                                            <div className="bg-white rounded-lg p-4">
                                                                {renderAdditionalDetails(quote)}
                                                                <div className="flex gap-2 mt-4">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); duplicateQuote(quote); }} 
                                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                    >
                                                                        <Copy className="w-4 h-4 mr-2" />
                                                                        Duplicate
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); reverseQuote(quote); }} 
                                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                    >
                                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                                        Reverse Route
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {activeTab === 'editHistory' && (
                                                            <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
                                                                <EditHistory quoteId={quote.id} searchTerm="" searchColumn="id" editHistory={editHistory} />
                                                            </div>
                                                        )}
                                                        {isAdmin && (
                                                            <div className="bg-white rounded-lg p-4 space-y-3">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                                                        <select
                                                                            aria-label="Quote Status"
                                                                            value={quote.brokers_status}
                                                                            onChange={(e) => handleStatusChange(e, quote.id)}
                                                                            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${getStatusClasses(quote.brokers_status)}`}
                                                                        >
                                                                            <option value="In Progress">In Progress</option>
                                                                            <option value="Need More Info">Need More Info</option>
                                                                            <option value="Priced">Priced</option>
                                                                            <option value="Cancelled">Cancelled</option>
                                                                        </select>
                                                                    </div>
                                                                    {showPriceInput === quote.id ? (
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote Price</label>
                                                                            <form onSubmit={(e) => handlePriceSubmit(e, quote.id)} className="flex gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    name="quotePrice"
                                                                                    value={carrierPayInput}
                                                                                    onChange={(e) => setCarrierPayInput(e.target.value)}
                                                                                    placeholder="Enter price"
                                                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                                                />
                                                                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                                                                                    Submit
                                                                                </button>
                                                                            </form>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing</label>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowPriceInput(quote.id);
                                                                                }}
                                                                                className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                                                                            >
                                                                                {quote.price ? 'Edit Quote' : 'Price Quote Request'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2 pt-2">
                                                                    <SelectTemplate quoteId={quote.id} />
                                                                    <button 
                                                                        onClick={() => archiveQuote(quote.id)} 
                                                                        className="text-red-600 px-4 py-2 border border-red-300 rounded-md text-sm font-medium hover:bg-red-50"
                                                                    >
                                                                        Archive Quote
                                                                    </button>
                                                                </div>
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

            <OrderFormModal
                isOpen={false}
                onClose={() => { }}
                onSubmit={() => { }}
                quote={null}
            />
        </div>
    );
}

export default QuoteTable;