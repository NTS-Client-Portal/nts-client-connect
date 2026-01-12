import React, { useState, useMemo, useEffect } from 'react';
import EditHistory from '../../EditHistory';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { formatQuoteId } from '@/lib/quoteUtils';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@/lib/supabase/provider';
import { Database } from '@/lib/database.types';
import { getCompaniesForSalesUser } from '@/lib/companyAssignment';
import { 
    QuoteStatus, 
    BrokersStatus,
    QUOTE_STATUS_LABELS,
    BROKERS_STATUS_LABELS,
    QUOTE_STATUS_STYLES,
    BROKERS_STATUS_STYLES,
    getStatusLabel,
    getStatusStyle,
    getValidBrokersTransitions
} from '@/lib/statusManagement';
import OrderFormModal from './OrderFormModal';
import RejectReasonModal from './RejectReasonModal';
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
    ChevronUp,
    Settings,
    Zap
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
    isEmailVerified: boolean;
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
    isEmailVerified,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [quotesState, setQuotes] = useState(quotes);
    const [editRequests, setEditRequests] = useState<{ [quoteId: number]: any }>({});
    const [selectedEditRequest, setSelectedEditRequest] = useState<any>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
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
                    // For sales reps/brokers, use standardized assignment system
                    // Instead of fetching from nts_users.company_id, get all assigned companies
                    const assignedCompanies = await getCompaniesForSalesUser(session.user.id);
                    
                    if (assignedCompanies && assignedCompanies.length > 0) {
                        // For now, if multiple companies are assigned, we'll need to handle this differently
                        // For backward compatibility, use the first company's ID
                        setCompanyId(assignedCompanies[0].company_id);
                    } else {
                        // Fallback to old method if no assignments found yet
                        const { data, error } = await supabase
                            .from('nts_users')
                            .select('company_id')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        if (error) {
                            console.error('Error fetching company ID from nts_users:', error.message);
                        } else {
                            setCompanyId(data?.company_id || null);
                        }
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

    // Fetch edit requests for brokers
    useEffect(() => {
        const fetchEditRequests = async () => {
            if (!isAdmin || !session?.user?.id) return;

            const quoteIds = quotes.map(q => q.id);
            if (quoteIds.length === 0) return;

            const { data, error } = await supabase
                .from('edit_requests')
                .select('*')
                .in('quote_id', quoteIds)
                .eq('status', 'pending');

            if (error) {
                console.error('Error fetching edit requests:', error);
            } else {
                const requestsMap: { [quoteId: number]: any } = {};
                data?.forEach(req => {
                    requestsMap[req.quote_id] = {
                        ...req,
                        requested_changes: typeof req.requested_changes === 'string' 
                            ? JSON.parse(req.requested_changes) 
                            : req.requested_changes
                    };
                });
                setEditRequests(requestsMap);
            }
        };

        fetchEditRequests();
    }, [quotes, isAdmin, session, supabase]);

    const handleReviewEditRequest = async (requestId: number, status: 'approved' | 'rejected', request: any) => {
        if (!session?.user?.id) return;

        setIsReviewing(true);
        try {
            // Update the edit request status
            const { error: updateError } = await supabase
                .from('edit_requests')
                .update({
                    status,
                    reviewed_by: session.user.id,
                    reviewed_at: new Date().toISOString(),
                    review_notes: reviewNotes || null
                })
                .eq('id', requestId);

            if (updateError) {
                console.error('Error updating edit request:', updateError);
                alert('Failed to update edit request');
                return;
            }

            // If approved, apply the changes to the quote
            if (status === 'approved' && request) {
                const { error: quoteUpdateError } = await supabase
                    .from('shippingquotes')
                    .update(
                        Object.keys(request.requested_changes).reduce((acc, key) => {
                            acc[key] = request.requested_changes[key].to;
                            return acc;
                        }, {} as Record<string, any>)
                    )
                    .eq('id', request.quote_id);

                if (quoteUpdateError) {
                    console.error('Error applying changes to quote:', quoteUpdateError);
                    alert('Edit request was approved but failed to apply changes to quote');
                    return;
                }
            }

            // Send notifications and emails (NON-BLOCKING)
            (async () => {
                try {
                    console.log(`📧 Starting notification process for edit request #${requestId} (${status})`);

                    // Get the shipper who requested the edit
                    const { data: shipperData, error: shipperError } = await supabase
                        .from('profiles')
                        .select('id, email, first_name, last_name')
                        .eq('id', request.requested_by)
                        .single();

                    if (shipperError || !shipperData) {
                        console.error('⚠️ Error fetching shipper data:', shipperError);
                        return;
                    }

                    // Get the broker's name
                    const { data: brokerData, error: brokerError } = await supabase
                        .from('nts_users')
                        .select('first_name, last_name')
                        .eq('id', session.user.id)
                        .single();

                    const brokerName = brokerError 
                        ? 'Your broker'
                        : `${brokerData?.first_name || ''} ${brokerData?.last_name || ''}`.trim() || 'Your broker';

                    // Create in-app notification
                    const notificationMessage = status === 'approved'
                        ? `Your edit request for Quote #${request.quote_id} has been approved by ${brokerName}. The changes have been applied.${reviewNotes ? ` Notes: ${reviewNotes}` : ''}`
                        : `Your edit request for Quote #${request.quote_id} has been rejected by ${brokerName}.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`;

                    const { error: notifError } = await supabase.from('notifications').insert({
                        user_id: shipperData.id,
                        message: notificationMessage,
                        type: 'edit_request_response'
                    });

                    if (notifError) {
                        console.error('⚠️ Error creating notification:', notifError);
                    } else {
                        console.log('✅ In-app notification created');
                    }

                    // Send email
                    console.log('📧 Preparing to send email...');
                    const changedFields = Object.keys(request.requested_changes).join(', ');
                    const statusText = status === 'approved' ? 'Approved' : 'Rejected';
                    const statusEmoji = status === 'approved' ? '✅' : '❌';

                    console.log('📬 Email details:', {
                        to: shipperData.email,
                        subject: `${statusEmoji} Edit Request ${statusText} - Quote #${request.quote_id}`,
                        quoteId: request.quote_id,
                        status
                    });

                    const emailResponse = await fetch('/.netlify/functions/sendEmail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: shipperData.email,
                            subject: `${statusEmoji} Edit Request ${statusText} - Quote #${request.quote_id}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: ${status === 'approved' ? '#10b981' : '#ef4444'};">
                                        ${statusEmoji} Edit Request ${statusText}
                                    </h2>
                                    <p>Hello ${shipperData.first_name || 'there'},</p>
                                    <p>Your edit request for <strong>Quote #${request.quote_id}</strong> has been <strong>${status}</strong> by ${brokerName}.</p>
                                    
                                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="margin-top: 0;">Requested Changes:</h3>
                                        <ul style="margin: 10px 0;">
                                            ${changedFields.split(', ').map(field => `<li>${field.replace(/_/g, ' ')}</li>`).join('')}
                                        </ul>
                                    </div>

                                    ${reviewNotes ? `
                                        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                                            <strong>${status === 'approved' ? 'Notes' : 'Reason for Rejection'}:</strong>
                                            <p style="margin: 5px 0 0 0;">${reviewNotes}</p>
                                        </div>
                                    ` : ''}

                                    ${status === 'approved' ? `
                                        <p style="color: #10b981; font-weight: bold; margin-bottom: 20px;">
                                            ✓ The changes have been applied to your quote.
                                        </p>
                                    ` : `
                                        <p style="margin-bottom: 20px;">If you have questions about this decision, please contact your broker.</p>
                                    `}

                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="https://www.shipper-connect.com/user/logistics-management?tab=quotes" 
                                           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                            View Your Quotes →
                                        </a>
                                    </div>

                                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                                    <p style="color: #6b7280; font-size: 14px;">
                                        Best regards,<br>
                                        NTS Logistics Team
                                    </p>
                                </div>
                            `,
                            text: `Edit Request ${statusText} - Quote #${request.quote_id}\n\nYour edit request has been ${status} by ${brokerName}.\n\nRequested Changes: ${changedFields}\n\n${reviewNotes ? `${status === 'approved' ? 'Notes' : 'Reason'}: ${reviewNotes}` : ''}\n\nView your quotes: https://www.shipper-connect.com/user/logistics-management?tab=quotes`
                        })
                    });

                    console.log('📧 Email response status:', emailResponse.status);
                    
                    if (!emailResponse.ok) {
                        const errorText = await emailResponse.text();
                        console.error('⚠️ Email send failed:', {
                            status: emailResponse.status,
                            statusText: emailResponse.statusText,
                            error: errorText
                        });
                    } else {
                        const responseData = await emailResponse.json();
                        console.log('✅ Email sent successfully:', responseData);
                    }

                } catch (asyncError) {
                    console.error('⚠️ Error in async notification/email:', asyncError);
                    console.error('⚠️ Error stack:', asyncError instanceof Error ? asyncError.stack : 'No stack trace');
                }
            })();

            // Remove from local state
            const newEditRequests = { ...editRequests };
            delete newEditRequests[request.quote_id];
            setEditRequests(newEditRequests);

            alert(`Edit request ${status} successfully!`);
            setSelectedEditRequest(null);
            setReviewNotes('');
            
            // Refresh quotes
            fetchQuotes();
        } catch (error) {
            console.error('Error reviewing request:', error);
            alert('Failed to process edit request');
        } finally {
            setIsReviewing(false);
        }
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };




    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, quoteId: number) => {
        const newStatus = e.target.value as BrokersStatus;

        // Update the status in the database
        const { error } = await supabase
            .from('shippingquotes')
            .update({ 
                brokers_status: newStatus,
                updated_by: session?.user?.id  // Track who made the change
            })
            .eq('id', quoteId);

        if (error) {
            console.error('Error updating status:', error.message);
        }
    };

    const getStatusClasses = (status: string) => {
        // Use the new status management system for styling
        return getStatusStyle(status as BrokersStatus);
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
                                        <div className="flex items-center gap-2 shrink-0">
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
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
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
                                                <h3 className="text-lg font-semibold text-gray-900">Quote {formatQuoteId(quote.id)}</h3>
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
                                                    {/* Quick Actions Section */}
                                                    <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-blue-600" />
                                                            Quick Actions
                                                        </h4>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); duplicateQuote(quote); }} 
                                                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium">Copy as New Quote</div>
                                                                    <div className="text-xs opacity-90">Same details</div>
                                                                </div>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); reverseQuote(quote); }} 
                                                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium">Copy Reversed</div>
                                                                    <div className="text-xs opacity-90">Swap locations</div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {renderAdditionalDetails(quote)}
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
                                    {/* Edit Request Alert for Mobile */}
                                    {isAdmin && editRequests[quote.id] && (
                                        <div className="mb-3 bg-amber-50 border-2 border-amber-400 rounded-lg p-3 animate-pulse">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-amber-600" />
                                                    <span className="font-semibold text-amber-900 text-sm">Pending Edit Request</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEditRequest(editRequests[quote.id]);
                                                }}
                                                className="w-full bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center justify-center gap-2 font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Review Edit Request
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(quote); }} 
                                            className="modern-btn-primary flex-1"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Quote
                                        </button>
                                        {quote.price && (
                                            <>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleCreateOrderClick(quote.id); 
                                                    }} 
                                                    className="modern-btn flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                    title="Create Order"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Create Order
                                                </button>
                                            </>
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
                                    
                                    {(isAdmin || !isUser) && (
                                        <div className="mt-3 space-y-2">
                                            <select
                                                aria-label="Quote Status"
                                                value={quote.brokers_status}
                                                onChange={(e) => handleStatusChange(e, quote.id)}
                                                className="modern-input w-full"
                                            >
                                                <option value="in_progress">In Progress</option>
                                                <option value="need_more_info">Need More Info</option>
                                                <option value="priced">Priced</option>
                                                <option value="dispatched">Dispatched</option>
                                                <option value="picked_up">Picked Up</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
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
                            <thead className="modern-table-header bg-linear-to-r from-blue-600 text-nowrap to-blue-700 text-white">
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
                                                <div className="flex items-center gap-2">
                                                    {formatQuoteId(quote.id)}
                                                    <ChevronUp 
                                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                                            expandedRow === quote.id ? 'rotate-180' : ''
                                                        }`} 
                                                    />
                                                </div>
                                            </td>
                                            <td className="modern-table-cell text-gray-500">
                                                {formatDate(quote.created_at)}
                                            </td>
                                            <td className="modern-table-cell text-gray-900">
                                                <div className="flex items-start gap-2">
                                                    <Truck className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
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
                                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
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
                                            <td className="px-3 py-4 whitespace-nowrap text-md font-semibold">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditClick(quote);
                                                            }}
                                                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-800 flex items-center gap-1"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        {isAdmin ? <span className="text-xs">Edit</span> : <span className="text-xs">Request Edit</span>}
                                                        </button>
                                                        {quote.price && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCreateOrderClick(quote.id);
                                                                }}
                                                                className="px-2 py-1 rounded flex items-center gap-1 bg-green-600 hover:bg-green-800 text-white"
                                                                title="Accept quote and create order"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span className="text-xs">Accept</span>
                                                            </button>
                                                        )}
                                                        {isUser && quote.price && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRejectClick(quote.id);
                                                                }}
                                                                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-800 flex items-center gap-1"
                                                                aria-label="Reject Quote"
                                                                title="Reject Quote"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                <span className="text-xs">Reject</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {/* Edit Request Badge for Brokers */}
                                                    {isAdmin && editRequests[quote.id] && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedEditRequest(editRequests[quote.id]);
                                                            }}
                                                            className="bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600 flex items-center gap-1 animate-pulse"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            <span className="text-xs font-semibold">Review Edit Request</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-md text-gray-700 max-w-xs">
                                                <div className="truncate text-xs" title={quote.notes || ''}>
                                                    {quote.notes}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === quote.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={8} className="px-4 py-6">
                                                    {/* Quick Actions Section */}
                                                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-blue-600" />
                                                            Quick Actions
                                                        </h4>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); duplicateQuote(quote); }} 
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium">Copy as New Quote</div>
                                                                    <div className="text-xs opacity-90">Create a new quote request with the same details</div>
                                                                </div>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); reverseQuote(quote); }} 
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
                                                    
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {/* Quote Details Card */}
                                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <Package className="w-4 h-4 text-blue-600" />
                                                                Quote Details
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {renderAdditionalDetails(quote)}
                                                            </div>
                                                        </div>

                                                        {/* Admin Controls Card */}
                                                        {(isAdmin || !isUser) && (
                                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                    <Settings className="w-4 h-4 text-blue-600" />
                                                                    Admin Controls
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                                                        <select
                                                                            aria-label="Quote Status"
                                                                            value={quote.brokers_status}
                                                                            onChange={(e) => handleStatusChange(e, quote.id)}
                                                                            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getStatusClasses(quote.brokers_status)}`}
                                                                        >
                                                                            <option value="in_progress">In Progress</option>
                                                                            <option value="need_more_info">Need More Info</option>
                                                                            <option value="priced">Priced</option>
                                                                            <option value="dispatched">Dispatched</option>
                                                                            <option value="picked_up">Picked Up</option>
                                                                            <option value="delivered">Delivered</option>
                                                                            <option value="cancelled">Cancelled</option>
                                                                        </select>
                                                                    </div>
                                                                    {showPriceInput === quote.id ? (
                                                                        <div 
                                                                            className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <form onSubmit={(e) => handlePriceSubmit(e, quote.id)} className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                                                                    <span className="text-sm font-medium text-blue-800">Set Quote Price</span>
                                                                                </div>
                                                                                
                                                                                <div>
                                                                                    <label htmlFor={`quotePrice-${quote.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                                                                                        Customer Price ($)
                                                                                    </label>
                                                                                    <input
                                                                                        id={`quotePrice-${quote.id}`}
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        name="quotePrice"
                                                                                        placeholder="Enter price"
                                                                                        className="w-full bg-white px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 "
                                                                                        required
                                                                                        autoFocus
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    />
                                                                                </div>
                                                                                
                                                                                <div className="flex gap-2 pt-1">
                                                                                    <button
                                                                                        type="submit"
                                                                                        className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-md text-xs font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                        Submit Price
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setShowPriceInput(null);
                                                                                        }}
                                                                                        className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
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
                                                                                className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                                                                            >
                                                                                <DollarSign className="w-4 h-4" />
                                                                                {quote.price ? 'Edit Quote' : 'Price Quote Request'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                                                                        <SelectTemplate quoteId={quote.id} />
                                                                        <button 
                                                                            onClick={() => archiveQuote(quote.id)} 
                                                                            className="text-red-600 px-4 py-2 border border-red-300 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                                                                        >
                                                                            Archive Quote
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Edit History Card */}
                                                        <div className="bg-white rounded-lg p-4 border border-gray-200 lg:col-span-2">
                                                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-blue-600" />
                                                                Edit History
                                                            </h4>
                                                            <div className="max-h-64 overflow-y-auto">
                                                                <EditHistory quoteId={quote.id} searchTerm="" searchColumn="id" editHistory={editHistory} />
                                                            </div>
                                                        </div>
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

            {/* Edit Request Review Modal */}
            {selectedEditRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                Review Edit Request for Quote #{selectedEditRequest.quote_id}
                            </h3>
                            <button
                                onClick={() => {
                                    setSelectedEditRequest(null);
                                    setReviewNotes('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Requested Changes */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Edit className="w-4 h-4" />
                                    Requested Changes:
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {Object.entries(selectedEditRequest.requested_changes).map(([key, change]: [string, any]) => (
                                        <div key={key} className="mb-3 last:mb-0">
                                            <span className="font-medium text-sm text-gray-800 block mb-1">
                                                {key.replace(/_/g, ' ').toUpperCase()}:
                                            </span>
                                            <div className="ml-4 flex items-center gap-2 text-sm">
                                                <span className="text-red-600 line-through bg-red-50 px-2 py-1 rounded">
                                                    {change.from || 'empty'}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                                    {change.to || 'empty'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reason */}
                            {selectedEditRequest.reason && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Shipper's Reason:</h4>
                                    <p className="text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        {selectedEditRequest.reason}
                                    </p>
                                </div>
                            )}

                            {/* Review Notes */}
                            <div>
                                <label className="block font-medium text-gray-700 mb-2">
                                    Your Review Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about your decision (e.g., reason for rejection, clarifications, etc.)..."
                                    className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {reviewNotes.length}/500 characters
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleReviewEditRequest(selectedEditRequest.id, 'approved', selectedEditRequest)}
                                    disabled={isReviewing}
                                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                >
                                    {isReviewing ? (
                                        <>
                                            <Clock className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Approve & Apply Changes
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleReviewEditRequest(selectedEditRequest.id, 'rejected', selectedEditRequest)}
                                    disabled={isReviewing}
                                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                >
                                    {isReviewing ? (
                                        <>
                                            <Clock className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5" />
                                            Reject Request
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedEditRequest(null);
                                        setReviewNotes('');
                                    }}
                                    disabled={isReviewing}
                                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuoteTable;
