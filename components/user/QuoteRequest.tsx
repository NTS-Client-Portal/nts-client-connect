import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@/lib/supabase/provider';
import { Session } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import QuoteForm from './QuoteForm';
import OrderForm from './OrderForm';
import QuoteList from './quotetabs/QuoteList';
import DeliveredList from './quotetabs/DeliveredList';
import OrderList from './quotetabs/OrderList';
import Archived from './quotetabs/Archived';
import RejectedList from './quotetabs/RejectedList';
import { useProfilesUser } from '@/context/ProfilesUserContext'; // Import ProfilesUserContext
import { useNtsUsers } from '@/context/NtsUsersContext';

interface QuoteRequestProps {
    session: Session | null;
    profiles: Database['public']['Tables']['profiles']['Row'][]; // Ensure profiles is passed as a prop
    companyId: string; // Add companyId as a prop
    userType: 'shipper' | 'broker';
}

const QuoteRequest: React.FC<QuoteRequestProps> = ({ session, profiles = [], companyId, userType }) => {
    const supabase = useSupabaseClient<Database>();
    const isUser = userType === 'shipper'; // Determine user type
    
    // Fix: Single context based on user type (addressing QA Analysis issue #1)
    const { userProfile: profilesUser, isEmailVerified } = useProfilesUser();
    const { userProfile: ntsUser } = useNtsUsers();
    const userContext = isUser ? profilesUser : ntsUser;

    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [orders, setOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
    const [editHistory, setEditHistory] = useState<Database['public']['Tables']['edit_history']['Row'][]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const router = useRouter();
    const { tab, searchTerm: searchTermParam, searchColumn: searchColumnParam } = router.query;
    const [activeTab, setActiveTab] = useState<string>(tab as string || 'requests');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>(searchTermParam as string || '');
    const [searchColumn, setSearchColumn] = useState<string>(searchColumnParam as string || 'id');
    const [assignedSalesUser, setAssignedSalesUser] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [rejectedRefreshTrigger, setRejectedRefreshTrigger] = useState<number>(0);
    
    // Email verification banner state
    const [showVerificationBanner, setShowVerificationBanner] = useState<boolean>(false);
    const [resendingEmail, setResendingEmail] = useState<boolean>(false);

    const fetchUserProfile = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isUser) {
            // For shippers, fetch company_id from profiles table
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching user profile from profiles:', error.message);
                return;
            }

            console.log('Fetched user profile from profiles:', profile);
        } else {
            // For sales reps/brokers, fetch company_id from nts_users table
            const { data: profile, error } = await supabase
                .from('nts_users')
                .select('company_id')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user profile from nts_users:', error.message);
                return;
            }

            console.log('Fetched user profile from nts_users:', profile);
        }
    }, [session, supabase, isUser]);

    // Fetch user role for sales reps
    const fetchUserRole = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('nts_users')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle(); // Use maybeSingle() to handle cases where no rows are returned

        if (error) {
            console.error('Error fetching user role:', error.message);
        } else if (!data) {
            console.warn('No user role found for the given ID.');
            setIsAdmin(false);
        } else {
            console.log('Fetched user role successfully:', data);
            setIsAdmin(true);
        }
    }, [session, supabase]);

    // Conditionally fetch data based on userType
    useEffect(() => {
        if (userType === 'shipper') {
            console.log('Fetching user profile for shipper...');
            fetchUserProfile(); // Fetch data for shippers
        } else if (userType === 'broker') {
            console.log('Fetching user role for broker...');
            fetchUserRole(); // Fetch data for brokers
        }
    }, [userType, fetchUserProfile, fetchUserRole]);


    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.id || !companyId) return;

        console.log('Fetching quotes of company'); // Add log to check companyId

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Quotes:', data);
            setQuotes(data);
            // Trigger refresh for rejected quotes when main quotes are fetched
            setRejectedRefreshTrigger(prev => prev + 1);
        }
    }, [session, companyId, supabase]);

    const fetchAssignedSalesUser = useCallback(async () => {
        if (!companyId) {
            console.error('Company ID is missing');
            return;
        }

        const { data, error } = await supabase
            .from('company_sales_users')
            .select('sales_user_id')
            .eq('company_id', companyId) // Use the actual companyId prop
            .single();

        if (error) {
            console.error('Error fetching assigned sales user:', error.message);
            return;
        }

        setAssignedSalesUser(data.sales_user_id);
    }, [companyId, supabase]);

    useEffect(() => {
        fetchUserProfile();
        fetchAssignedSalesUser();
    }, [fetchUserProfile, fetchAssignedSalesUser]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1230);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from('nts_users')
                .select('id')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user role:', error.message);
            } else if (data) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        };

        fetchUserRole();
    }, [session, supabase]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTermParam = urlParams.get('searchTerm');
        const searchColumnParam = urlParams.get('searchColumn');

        if (searchTermParam) {
            setSearchTerm(searchTermParam);
        }

        if (searchColumnParam) {
            setSearchColumn(searchColumnParam);
        }
    }, [router.query]);

    const addQuote = async (quote: Partial<Database['public']['Tables']['shippingquotes']['Insert'] & { containerLength?: number | null; containerType?: string | null; contentsDescription?: string | null; selectedOption?: string | null; }>) => {
        if (!session?.user?.id) return;

        // 🚨 CRITICAL FAILSAFE: NEVER block quote submissions!
        // Customer experience and sales opportunities are the priority
        const finalCompanyId = quote.company_id || companyId || null;
        
        // Log warning if company_id is missing but DO NOT block submission
        if (!finalCompanyId) {
            console.warn('🚨 ALERT: Quote submitted without company_id - needs admin review!', {
                user_id: session.user.id,
                quote_data: quote,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        }

        // Log the quote object for debugging
        console.log('Adding quote with company_id:', finalCompanyId, quote);

        // Prepare quote data with failsafe defaults
        const safeQuoteData = {
            ...quote,
            user_id: session.user.id,
            company_id: finalCompanyId, // Allow null - we'll fix this later
            first_name: quote.first_name || null,
            last_name: quote.last_name || null,
            email: quote.email || null,
            inserted_at: quote.inserted_at || new Date().toISOString(),
            is_complete: quote.is_complete || false,
            is_archived: quote.is_archived || false,
            year: quote.year?.toString() || null,
            make: quote.make || null,
            model: quote.model || null,
            auto_year: quote.auto_year?.toString() || null,
            auto_make: quote.auto_make || null,
            auto_model: quote.auto_model || null,
            commodity: quote.commodity || null,
            packaging_type: quote.packaging_type || null,
            load_description: quote.load_description || null,
            length: quote.length?.toString() || null,
            length_unit: quote.length_unit || null,
            width: quote.width?.toString() || null,
            width_unit: quote.width_unit || null,
            height: quote.height?.toString() || null,
            height_unit: quote.height_unit || null,
            weight: quote.weight?.toString() || null,
            weight_unit: quote.weight_unit || null,
            freight_class: quote.freight_class || null,
            freight_type: quote.freight_type || null,
            goods_value: quote.goods_value || null,
            loading_assistance: quote.loading_assistance || null,
            dock_no_dock: quote.dock_no_dock || null,
            weight_per_pallet_unit: quote.weight_per_pallet_unit || null,
            temperature_range: quote.temperature_range || null,
            temperature_instructions: quote.temperature_instructions || null,
            status: quote.status || 'quote',
            // Add metadata for admin review if needed
            needs_admin_review: !finalCompanyId,
        };

        const { data: shippingQuoteData, error: shippingQuoteError } = await supabase
            .from('shippingquotes')
            .insert([safeQuoteData])
            .select();

        if (shippingQuoteError) {
            console.error('Error adding quote:', shippingQuoteError.message);
            setErrorText('Error adding quote');
            return;
        }

        console.log('Quote added successfully:', shippingQuoteData);
        
        // If quote was saved without company_id, log critical alert for manual review
        if (shippingQuoteData && shippingQuoteData.length > 0 && !finalCompanyId) {
            // Log critical alert to console for monitoring and manual review
            console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                message: 'Quote submitted without company assignment',
                quote_id: shippingQuoteData[0].id,
                user_id: session.user.id,
                timestamp: new Date().toISOString(),
                action_required: 'Admin needs to assign company_id to this quote ASAP',
                customer_impact: 'Customer submitted quote successfully but NTS users cannot see it yet'
            });
            
            // Also show a user-friendly message
            setErrorText('Quote submitted successfully! Our team will review and respond shortly.');
        }
        
        // Try to notify assigned sales users (if company_id exists)
        if (shippingQuoteData && shippingQuoteData.length > 0 && finalCompanyId) {
            try {
                const { data: assignedUsers, error: assignedError } = await supabase
                    .from('company_sales_users')
                    .select('sales_user_id')
                    .eq('company_id', finalCompanyId);

                if (!assignedError && assignedUsers) {
                    console.log('Notifying assigned users:', assignedUsers);
                    
                    for (const user of assignedUsers) {
                        await supabase
                            .from('notifications')
                            .insert({
                                nts_user_id: user.sales_user_id,
                                message: `New quote request #${shippingQuoteData[0].id} from ${quote.first_name} ${quote.last_name}`,
                                type: 'quote_request',
                                is_read: false,
                                created_at: new Date().toISOString()
                            });
                    }
                    console.log('Notifications sent successfully');
                } else {
                    console.error('Error fetching assigned users for notifications:', assignedError);
                }
            } catch (error) {
                console.error('Error sending notifications:', error);
            }
        }
        
        setQuotes([...quotes, ...(shippingQuoteData || [])]);

        setErrorText('');
        setIsModalOpen(false);
        fetchQuotes();
    };

    const addOrder = async (order: Partial<Database['public']['Tables']['shippingquotes']['Insert'] & { containerLength?: number | null; containerType?: string | null; contentsDescription?: string | null; selectedOption?: string | null; origin_address?: string | null; origin_name?: string | null; origin_phone?: string | null; earliest_pickup_date?: string | null; latest_pickup_date?: string | null; destination_street?: string | null; destination_name?: string | null; destination_phone?: string | null; }>) => {
        if (!session?.user?.id) return;

        // 🚨 CRITICAL FAILSAFE: NEVER block order submissions!
        const finalCompanyId = order.company_id || companyId || null;
        
        // Log warning if company_id is missing but DO NOT block submission
        if (!finalCompanyId) {
            console.warn('🚨 ALERT: Order submitted without company_id - needs admin review!', {
                user_id: session.user.id,
                order_data: order,
                timestamp: new Date().toISOString()
            });
        }

        console.log('Adding order:', order);

        const { data: shippingQuoteData, error: shippingQuoteError } = await supabase
            .from('shippingquotes')
            .insert([{
                ...order,
                user_id: session.user.id,
                company_id: finalCompanyId, // Allow null - we'll fix this later
                first_name: order.first_name || null,
                last_name: order.last_name || null,
                email: order.email || null,
                inserted_at: order.inserted_at || new Date().toISOString(),
                is_complete: order.is_complete || false,
                is_archived: order.is_archived || false,
                year: order.year?.toString() || null,
                make: order.make || null,
                model: order.model || null,
                auto_year: order.auto_year?.toString() || null,
                auto_make: order.auto_make || null,
                auto_model: order.auto_model || null,
                commodity: order.commodity || null,
                packaging_type: order.packaging_type || null,
                load_description: order.load_description || null,
                length: order.length?.toString() || null,
                length_unit: order.length_unit || null,
                width: order.width?.toString() || null,
                width_unit: order.width_unit || null,
                height: order.height?.toString() || null,
                height_unit: order.height_unit || null,
                weight: order.weight?.toString() || null,
                weight_unit: order.weight_unit || null,
                freight_class: order.freight_class || null,
                freight_type: order.freight_type || null,
                goods_value: order.goods_value || null,
                loading_assistance: order.loading_assistance || null,
                dock_no_dock: order.dock_no_dock || null,
                weight_per_pallet_unit: order.weight_per_pallet_unit || null,
                temperature_range: order.temperature_range || null,
                temperature_instructions: order.temperature_instructions || null,
                status: order.status || 'order',
                origin_address: order.origin_address || null,
                origin_name: order.origin_name || null,
                origin_phone: order.origin_phone || null,
                earliest_pickup_date: order.earliest_pickup_date || null,
                latest_pickup_date: order.latest_pickup_date || null,
                destination_street: order.destination_street || null,
                destination_name: order.destination_name || null,
                destination_phone: order.destination_phone || null,
                needs_admin_review: !finalCompanyId,
            }])
            .select();

        if (shippingQuoteError) {
            console.error('Error adding order:', shippingQuoteError.message);
            setErrorText('Error adding order');
            return;
        }

        // If order was saved without company_id, log critical alert
        if (shippingQuoteData && shippingQuoteData.length > 0 && !finalCompanyId) {
            console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                message: 'Order submitted without company assignment',
                order_id: shippingQuoteData[0].id,
                user_id: session.user.id,
                timestamp: new Date().toISOString(),
                action_required: 'Admin needs to assign company_id to this order ASAP'
            });
        }

        console.log('Order added successfully:', shippingQuoteData);
        setOrders([...orders, ...(shippingQuoteData || []).map(order => ({
            ...order,
            dock_no_dock: order.dock_no_dock === 'true'
        }))]);

        setErrorText('');
        setIsModalOpen(false);
        fetchQuotes();
    };

    // Resend verification email handler
    const handleResendVerification = async () => {
        if (!session?.user?.email) return;

        setResendingEmail(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: session.user.email,
            });

            if (error) {
                console.error('Error resending verification email:', error);
                alert('Failed to resend verification email. Please try again.');
            } else {
                alert('Verification email sent! Please check your inbox.');
            }
        } catch (error) {
            console.error('Unexpected error resending email:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setResendingEmail(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (profilesUser) {
            if (tab === 'orders') {
                router.push(`/user/logistics-management?tab=orders&searchTerm=${searchTerm}&searchColumn=${searchColumn}`, undefined, { shallow: true });
            } else {
                router.push(`/user/logistics-management?tab=${tab}`, undefined, { shallow: true });
            }
        } else if (ntsUser) {
            router.push(`/companies/${companyId}`);
        }
    };

    return (
        <div className="w-full h-full absolute z-0! p-3">
            {/* Email Verification Banner - Only show for unverified shippers */}
            {isUser && !isEmailVerified && (
                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Email Verification Required
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    To create shipping orders and protect against fraud, please verify your email address. 
                                    You can still request quotes and browse your dashboard.
                                </p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={handleResendVerification}
                                    disabled={resendingEmail}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {resendingEmail ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-800" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Resend Verification Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setShowVerificationBanner(false)}
                                className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col justify-start md:flex-row md:justify-between items-center mb-4">
                <p className='font-semibold py-2 text-gray-800 text-nowrap'>Manage your shipments here</p>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="text-base mr-6 text-white rounded-md bg-blue-700 hover:bg-blue-800 px-4 py-2 font-semibold transition-colors"
                >
                    {activeTab === 'orders' ? 'Request a Shipping Order' : 'Request a Shipping Estimate'}
                </button>
            </div>
            
            {activeTab === 'requests' ? (
                <QuoteForm
                    session={session}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    addQuote={addQuote}
                    errorText={errorText}
                    setErrorText={setErrorText}
                    assignedSalesUser={assignedSalesUser}
                    fetchQuotes={fetchQuotes}
                    companyId={companyId}
                />
            ) : (
                <OrderForm
                    session={session}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    addOrder={addOrder}
                    errorText={errorText}
                    setErrorText={setErrorText}
                    companyId={companyId}
                    fetchOrders={fetchQuotes}
                    assignedSalesUser={assignedSalesUser}
                />
            )}

            {isMobile ? (
                <div className="relative">
                    <label htmlFor="tab-select" className="sr-only">Select shipment tab</label>
                    <select
                        id="tab-select"
                        aria-label="Select shipment tab"
                        className="nts-input"
                        value={activeTab}
                        onChange={(e) => handleTabChange(e.target.value)}
                    >
                        <option value="requests">Shipping Requests</option>
                        <option value="orders">Shipping Orders</option>
                        <option value="delivered">Delivered Orders</option>
                        <option value="rejected">Rejected RFQ&apos;s</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            ) : (
                <div className="nts-tabs">
                    <div className="nts-tab-list">
                        <button
                            className={`nts-tab ${activeTab === 'requests' ? 'active' : ''}`}
                            onClick={() => handleTabChange('requests')}
                        >
                            Shipping Requests
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => handleTabChange('orders')}
                        >
                            Active Orders
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'delivered' ? 'active' : ''}`}
                            onClick={() => handleTabChange('delivered')}
                        >
                            Delivered
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'archived' ? 'active' : ''}`}
                            onClick={() => handleTabChange('archived')}
                        >
                            Archived
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                            onClick={() => handleTabChange('rejected')}
                        >
                            Rejected
                        </button>
                    </div>
                </div>
            )}
            <div className="nts-tab-content">
                {activeTab === 'requests' && (
                    <QuoteList
                        session={session}
                        fetchQuotes={fetchQuotes}
                        isAdmin={isAdmin}
                        selectedUserId={selectedUserId}
                        isUser={isUser}
                        companyId={companyId}
                        isEmailVerified={isEmailVerified}
                    />
                )}
                {activeTab === 'orders' && (
                    <OrderList
                        session={session}
                        fetchQuotes={fetchQuotes}
                        isAdmin={isAdmin}
                        selectedUserId={selectedUserId}
                        companyId={companyId}
                    />
                )}
                {activeTab === 'delivered' && (
                    <DeliveredList
                        session={session}
                        isAdmin={isAdmin}
                        fetchQuotes={fetchQuotes}
                        selectedUserId={selectedUserId}
                        companyId={companyId}
                    />
                )}
                {activeTab === 'archived' && (
                    <Archived
                        session={session}
                        isAdmin={isAdmin}
                        fetchQuotes={fetchQuotes}
                        selectedUserId={selectedUserId}
                        companyId={companyId}
                    />
                )}
                {activeTab === 'rejected' && (
                    <RejectedList
                        session={session}
                        isAdmin={isAdmin}
                        fetchQuotes={fetchQuotes}
                        selectedUserId={selectedUserId}
                        companyId={companyId}
                        refreshTrigger={rejectedRefreshTrigger}
                    />
                )}
            </div>
        </div>
    );
};

export default QuoteRequest;