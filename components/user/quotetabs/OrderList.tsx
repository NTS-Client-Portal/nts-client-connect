import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import Modal from '@/components/ui/Modal';
import OrderTable from './OrderTable';
import OrderDetailsMobile from '../mobile/OrderDetailsMobile';
import EditQuoteModal from './EditQuoteModal';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';
import { generatePDF, uploadPDFToSupabase, insertDocumentRecord } from '@/components/GeneratePDF';
import { useRouter } from 'next/router';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface OrderListProps {
    session: Session | null;
    selectedUserId: string;
    fetchQuotes: () => void;
    isAdmin: boolean;
    companyId: string;
}

const OrderList: React.FC<OrderListProps> = ({ session, isAdmin, companyId, fetchQuotes }) => {
    const [quotes, setQuotes] = useState<ShippingQuotesRow[]>([]);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: 'asc' | 'desc' }>({ column: '', order: 'asc' });
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [sortedQuotes, setSortedQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [cancellationReason, setCancellationReason] = useState<string>('');
    const [loadDates, setLoadDates] = useState<{ [key: number]: string }>({});
    const [deliveryDates, setDeliveryDates] = useState<{ [key: number]: string }>({});
    const [getStatusClasses, setGetStatusClasses] = useState(() => (status: string) => 'bg-gray-100 text-gray-800');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [quoteToEdit, setQuoteToEdit] = useState<ShippingQuotesRow | null>(null);
    const [isNtsUser, setIsNtsUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchColumn, setSearchColumn] = useState<string>('id');
    const router = useRouter();

    const fetchProfiles = useCallback(
        async (companyId: string) => {
            console.log('Fetching profiles for companyId:', companyId); // Add log to check companyId

            const { data: profiles, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("company_id", companyId);

            if (error) {
                console.error("Error fetching profiles:", error.message);
                return [];
            }

            return profiles;
        },
        []
    );

    const fetchOrders = useCallback(
        async (profileIds: string[]) => {
            const { data: allOrders, error } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("user_id", profileIds)
                .not('is_complete', 'is', true);

            if (error) {
                console.error("Error fetching orders:", error.message);
                return [];
            }

            // Filter for orders with case-insensitive status check
            const orders = allOrders?.filter(order => {
                const status = order.status?.toLowerCase() || '';
                return status === 'order';
            }) || [];

            return orders;
        },
        []
    );

    const fetchOrdersForNtsUsers = useCallback(
        async (userId: string, companyId: string) => {
            console.log('Fetching orders for nts_user with companyId:', companyId); // Add log to check companyId

            const { data: companySalesUsers, error: companySalesUsersError } = await supabase
                .from("company_sales_users")
                .select("company_id")
                .eq("sales_user_id", userId);

            if (companySalesUsersError) {
                console.error(
                    "Error fetching company_sales_users for nts_user:",
                    companySalesUsersError.message
                );
                return [];
            }

            const companyIds = companySalesUsers.map(
                (companySalesUser) => companySalesUser.company_id
            );

            if (!companyIds.includes(companyId)) {
                console.error("Company ID not assigned to the user");
                return [];
            }

            const { data: allOrders, error: ordersError } = await supabase
                .from("shippingquotes")
                .select("*")
                .eq("company_id", companyId)
                .not('is_complete', 'is', true);

            if (ordersError) {
                console.error(
                    "Error fetching orders for nts_user:",
                    ordersError.message
                );
                return [];
            }

            // Filter for orders with case-insensitive status check
            const orders = allOrders?.filter(order => {
                const status = order.status?.toLowerCase() || '';
                return status === 'order';
            }) || [];

            return orders;
        },
        []
    );

    const fetchInitialQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isAdmin) {
            const ordersData = await fetchOrdersForNtsUsers(session.user.id, companyId);
            setQuotes(ordersData);
        } else {
            // Fetch the user's profile
            const { data: userProfile, error: userProfileError } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", session.user.id)
                .single();

            if (userProfileError) {
                console.error("Error fetching user profile:", userProfileError.message);
                return;
            }

            if (!userProfile) {
                console.error("No profile found for user");
                return;
            }

            const companyId = userProfile.company_id;
            const profilesData = await fetchProfiles(companyId);

            const profileIds = profilesData.map((profile) => profile.id);
            const ordersData = await fetchOrders(profileIds);

            setQuotes(ordersData);
        }
    }, [
        session,
        fetchProfiles,
        fetchOrders,
        fetchOrdersForNtsUsers,
        isAdmin,
        companyId,
    ]);

    useEffect(() => {
        fetchInitialQuotes();
    }, [fetchInitialQuotes]);

    useEffect(() => {
        const checkUserType = async () => {
            if (session?.user?.id) {
                const { data: ntsUserData, error: ntsUserError } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (ntsUserError) {
                    console.error('Error fetching nts_user role:', ntsUserError.message);
                } else if (ntsUserData) {
                    const orders = await fetchOrdersForNtsUsers(session.user.id, companyId);
                    setQuotes(orders);
                    return;
                }

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError.message);
                } else if (profileData?.company_id) {
                    const profilesData = await fetchProfiles(profileData.company_id);
                    const profileIds = profilesData.map((profile) => profile.id);
                    const orders = await fetchOrders(profileIds);
                    setQuotes(orders);
                    return;
                }

                fetchQuotes();
            }
        };

        checkUserType();
    }, [session, fetchQuotes, fetchOrdersForNtsUsers, fetchOrders, fetchProfiles, companyId]);

    useEffect(() => {
        const filteredAndSorted = quotes
            .filter((quote) => {
                const value = quote[searchColumn]?.toString().toLowerCase() || '';
                return value.includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                if (a[sortConfig.column] < b[sortConfig.column]) {
                    return sortConfig.order === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.column] > b[sortConfig.column]) {
                    return sortConfig.order === 'asc' ? 1 : -1;
                }
                return 0;
            });

        setSortedQuotes(filteredAndSorted);
    }, [quotes, sortConfig, searchTerm, searchColumn]);

    const handleSort = (column: string, order: string) => {
        setSortConfig({ column, order: order as 'asc' | 'desc' });
    };

    useEffect(() => {
        if (searchTerm) {
            const orderId = parseInt(searchTerm, 10);
            if (!isNaN(orderId)) {
                setExpandedRow(orderId);
            }
        }
    }, [searchTerm]);

    const handleRowClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const archiveOrder = async (quoteId: number) => {
        const { error } = await supabase
            .from('shippingquotes')
            .update({ is_archived: true, status: 'archived' })
            .eq('id', quoteId);

        if (error) {
            console.error('Error archiving quote:', error.message);
            setErrorText('Error archiving quote');
        } else {
            setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== quoteId));
        }
    };

    const handleMarkAsComplete = async (quoteId: number): Promise<void> => {
        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update({ is_complete: true })
                .eq('id', quoteId);

            if (error) {
                console.error('Error marking quote as complete:', error.message);
                setErrorText('Error marking quote as complete');
            } else {
                const quote = quotes.find(q => q.id === quoteId);
                if (quote) {
                    // Fetch the template for order completion
                    const { data: templateData, error: templateError } = await supabase
                        .from('templates')
                        .select('content, title')
                        .eq('context', 'order')
                        .single();

                    if (templateError) {
                        console.error('Error fetching template:', templateError.message);
                        return;
                    }

                    // Generate PDF and upload to Supabase
                    const pdf = await generatePDF(quote, templateData.content);
                    const fileName = `${templateData.title.replace(/\s+/g, '_')}_for_Quote_${quote.id}.pdf`;
                    const filePath = await uploadPDFToSupabase(pdf, fileName);
                    await insertDocumentRecord(filePath, quote, templateData.title);

                    // Create a notification for the user
                    const notificationMessage = `Order ID ${quote.id} was delivered. <a class="text-ntsLightBlue underline font-semibold" href="/user/documents">View Order Details</a>`;
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: quote.user_id,
                            message: notificationMessage,
                            is_read: false,
                        });
                }
                setQuotes(quotes.filter(quote => quote.id !== quoteId));
            }
        } catch (error) {
            console.error('Error marking quote as complete:', error);
            setErrorText('Error marking quote as complete');
        }
        setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== quoteId));
    };

    const handleEditQuote = (quote: ShippingQuotesRow) => {
        setQuoteToEdit(quote);
        setIsEditModalOpen(true);
    };

    const handleEditModalSubmit = async (updatedQuote: ShippingQuotesRow) => {
        if (!session?.user?.id) return;

        try {
            const { error: updateError } = await supabase
                .from('shippingquotes')
                .update(updatedQuote)
                .eq('id', updatedQuote.id);

            if (updateError) {
                console.error('Error updating quote:', updateError.message);
                setErrorText('Error updating quote');
                return;
            }

            // Update local state
            setQuotes(quotes.map(quote => 
                quote.id === updatedQuote.id ? updatedQuote : quote
            ));
            
            setIsEditModalOpen(false);
            setQuoteToEdit(null);
        } catch (error) {
            console.error('Error updating quote:', error);
            setErrorText('Error updating quote');
        }
    };

    const confirmCancelQuote = async () => {
        if (selectedQuoteId === null) return;

        try {
            const { error } = await supabase
                .from('shippingquotes')
                .update({ status: 'cancelled', cancellation_reason: cancellationReason })
                .eq('id', selectedQuoteId);

            if (error) {
                console.error('Error cancelling quote:', error.message);
                setErrorText('Error cancelling quote');
            } else {
                setQuotes(quotes.filter(quote => quote.id !== selectedQuoteId));
                setIsModalOpen(false);
                setSelectedQuoteId(null);
                setCancellationReason('');
            }
        } catch (error) {
            console.error('Error cancelling quote:', error);
            setErrorText('Error cancelling quote. Please check your internet connection and try again.');
        }
    };

    const duplicateQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        // Implement failsafe system: preserve or failsafe company_id
        let finalCompanyId: string | null = quote.company_id || companyId || null;
        
        // If no company_id available, allow duplication but flag for admin review
        if (!finalCompanyId) {
            console.warn('⚠️ Duplicate quote being created without company_id - will need admin review');
        }

        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                company_id: finalCompanyId, // Use failsafe company_id
                due_date: null,
                price: null,
                status: 'quote', // Reset to quote status
                created_at: new Date().toISOString(),
                needs_admin_review: !finalCompanyId, // Flag for admin review if needed
            })
            .select();

        if (error) {
            console.error('Error duplicating quote:', error.message);
            setErrorText('Error duplicating quote');
        } else {
            if (data && data.length > 0) {
                // If quote was saved without company_id, log critical alert
                if (!finalCompanyId) {
                    console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                        message: 'Duplicate quote created without company assignment from OrderList',
                        quote_id: data[0].id,
                        original_order_id: quote.id,
                        timestamp: new Date().toISOString(),
                        action_required: 'Admin needs to assign company_id to this duplicate quote ASAP'
                    });
                }
                console.log(`Duplicate Quote Request Added - Quote #${data[0].id}`);
            }
            fetchInitialQuotes();
        }
    };

    const reverseQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        // Implement failsafe system: preserve or failsafe company_id
        let finalCompanyId: string | null = quote.company_id || companyId || null;
        
        // If no company_id available, allow reverse but flag for admin review
        if (!finalCompanyId) {
            console.warn('⚠️ Reverse quote being created without company_id - will need admin review');
        }

        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                company_id: finalCompanyId, // Use failsafe company_id
                due_date: null,
                price: null,
                status: 'quote', // Reset to quote status
                origin_city: quote.destination_city,
                origin_state: quote.destination_state,
                origin_zip: quote.destination_zip,
                destination_city: quote.origin_city,
                destination_state: quote.origin_state,
                destination_zip: quote.origin_zip,
                created_at: new Date().toISOString(),
                needs_admin_review: !finalCompanyId, // Flag for admin review if needed
            })
            .select();

        if (error) {
            console.error('Error reversing quote:', error.message);
            setErrorText('Error reversing quote');
        } else {
            if (data && data.length > 0) {
                // If quote was saved without company_id, log critical alert
                if (!finalCompanyId) {
                    console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                        message: 'Reverse quote created without company assignment from OrderList',
                        quote_id: data[0].id,
                        original_order_id: quote.id,
                        timestamp: new Date().toISOString(),
                        action_required: 'Admin needs to assign company_id to this reverse quote ASAP'
                    });
                }
                console.log(`Flip Route Duplicate Request Added - Quote #${data[0].id}`);
            }
            fetchInitialQuotes();
        }
    };

    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>, id: number, dateType: 'load' | 'delivery') => {
        const date = e.target.value;
        if (dateType === 'load') {
            setLoadDates(prev => ({ ...prev, [id]: date }));
        } else {
            setDeliveryDates(prev => ({ ...prev, [id]: date }));
        }
    };

    const handleSubmitDates = async (id: number) => {
        // Implementation for submitting dates
        console.log('Submit dates for order:', id, { load: loadDates[id], delivery: deliveryDates[id] });
    };

    useEffect(() => {
        const channel = supabase
            .channel('shippingquotes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shippingquotes' },
                (payload) => {
                    console.log('Change received!', payload);
                    if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object') {
                        const status = (payload.new as any)?.status?.toLowerCase() || '';
                        if (status === 'order') {
                            fetchInitialQuotes();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup subscription
        };
    }, [fetchInitialQuotes]);

    return (
        <div className="w-full h-auto min-h-full">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden xl:block overflow-x-auto md:overflow-x-hidden">
                <OrderTable
                    sortConfig={{ column: 'id', order: 'asc' }}
                    handleSort={handleSort}
                    orders={quotes}
                    expandedRow={expandedRow}
                    handleRowClick={handleRowClick}
                    archiveOrder={archiveOrder}
                    handleMarkAsComplete={(id) => () => handleMarkAsComplete(id)}
                    isAdmin={isAdmin}
                    handleEditClick={handleEditQuote}
                    duplicateQuote={duplicateQuote}
                    reverseQuote={reverseQuote}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchColumn={searchColumn}
                    setSearchColumn={setSearchColumn}
                />
            </div>
            <div className="block xl:hidden">
                <OrderDetailsMobile
                    orders={quotes}
                    handleEditClick={handleEditQuote}
                    handleMarkAsComplete={(id) => () => handleMarkAsComplete(id)}
                    duplicateQuote={duplicateQuote}
                    reverseQuote={reverseQuote}
                    isAdmin={isNtsUser}
                    formatDate={formatDate}
                    loadDates={loadDates}
                    deliveryDates={deliveryDates}
                    handleDateChange={handleDateChange}
                    handleSubmitDates={handleSubmitDates}
                    getStatusClasses={getStatusClasses}
                />
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2 className="text-xl mb-4">Are you sure you want to cancel the quote?</h2>
                <button onClick={confirmCancelQuote} className="bg-red-500 text-white px-4 py-2 rounded mr-2">
                    Yes
                </button>
                <button onClick={() => setIsModalOpen(false)} className="bg-zinc-500 text-white px-4 py-2 rounded">
                    No
                </button>
                {selectedQuoteId !== null && (
                    <div className="mt-4">
                        <label htmlFor="reason" className="block text-sm text-zinc-700">
                            Reason for cancellation:
                        </label>
                        <input
                            type="text"
                            id="reason"
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="mt-1 p-2 border border-zinc-300 rounded w-full"
                        />
                    </div>
                )}
            </Modal>
            
            <EditQuoteModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditModalSubmit}
                quote={quoteToEdit}
                isAdmin={isAdmin}
                session={session}
                companyId={companyId}
            />
        </div>
    );
};

export default OrderList;