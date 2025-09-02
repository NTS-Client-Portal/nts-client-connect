import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
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
    const { userProfile: profilesUser } = useProfilesUser();
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
                .single();

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
                .single();

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

        // Log the quote object to check if company_id is included
        console.log('Adding quote:', quote);

        const { data: shippingQuoteData, error: shippingQuoteError } = await supabase
            .from('shippingquotes')
            .insert([{
                ...quote,
                user_id: session.user.id,
                company_id: quote.company_id || companyId,
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
                status: quote.status || 'Quote',
            }])
            .select();

        if (shippingQuoteError) {
            console.error('Error adding quote:', shippingQuoteError.message);
            setErrorText('Error adding quote');
            return;
        }

        console.log('Quote added successfully:', shippingQuoteData);
        setQuotes([...quotes, ...(shippingQuoteData || [])]);

        setErrorText('');
        setIsModalOpen(false);
        fetchQuotes();
    };

    const addOrder = async (order: Partial<Database['public']['Tables']['shippingquotes']['Insert'] & { containerLength?: number | null; containerType?: string | null; contentsDescription?: string | null; selectedOption?: string | null; origin_address?: string | null; origin_name?: string | null; origin_phone?: string | null; earliest_pickup_date?: string | null; latest_pickup_date?: string | null; destination_street?: string | null; destination_name?: string | null; destination_phone?: string | null; }>) => {
        if (!session?.user?.id) return;

        console.log('Adding order:', order);

        const { data: shippingQuoteData, error: shippingQuoteError } = await supabase
            .from('shippingquotes')
            .insert([{
                ...order,
                user_id: session.user.id,
                company_id: order.company_id || companyId,
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
                width: order.width?.toString() || null,
                width_unit: order.width_unit || null,
                height: order.height?.toString() || null,
                height_unit: order.height_unit || null,
                weight: order.weight?.toString() || null,
                weight_unit: order.weight_unit || null,
                status: order.status || 'Order',
                origin_address: order.origin_address || null,
                origin_name: order.origin_name || null,
                origin_phone: order.origin_phone || null,
                earliest_pickup_date: order.earliest_pickup_date || null,
                latest_pickup_date: order.latest_pickup_date || null,
                destination_street: order.destination_street || null,
                destination_name: order.destination_name || null,
                destination_phone: order.destination_phone || null,
            }])
            .select();

        if (shippingQuoteError) {
            console.error('Error adding order:', shippingQuoteError.message);
            setErrorText('Error adding order');
            return;
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
        <div className="w-full h-full absolute !z-0">
            {quotes ? (
                <div className="flex mb-4">
                    <p className='text-start font-semibold py-2 text-gray-800 text-nowrap'>Welcome {profilesUser?.first_name} {profilesUser?.last_name} <br /> Manage your shipments here</p>
                </div>
            ) : quotes.length === 0 ? (
                <div className="w-full">
                    <div className='flex flex-col justify-center items-center gap-2 mb-4'>
                        <button onClick={() => setIsModalOpen(true)} className="text-base text-white rounded bg-zinc-900 px-2 py-1 cursor-point font-semibold">
                            {activeTab === 'orders' ? 'Request a Shipping Order' : 'Request a Shipping Estimate'}
                        </button>
                    </div>
                </div>
            ) : ("")}
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
                <div className="relative z-[-50]">
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
                            📋 Shipping Requests
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => handleTabChange('orders')}
                        >
                            🚛 Active Orders
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'delivered' ? 'active' : ''}`}
                            onClick={() => handleTabChange('delivered')}
                        >
                            ✅ Delivered
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'archived' ? 'active' : ''}`}
                            onClick={() => handleTabChange('archived')}
                        >
                            📁 Archived
                        </button>
                        <button
                            className={`nts-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                            onClick={() => handleTabChange('rejected')}
                        >
                            ❌ Rejected
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