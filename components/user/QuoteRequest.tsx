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
}

const QuoteRequest: React.FC<QuoteRequestProps> = ({ session, profiles = [], companyId }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile: profilesUser } = useProfilesUser(); // Use ProfilesUserContext
    const { userProfile: ntsUser } = useNtsUsers(); // Use NtsUsersContext
    const isUser = !ntsUser;
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

    const fetchUserProfile = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error.message);
            return;
        }

        setSelectedUserId(profile.company_id);
    }, [session, supabase]);

    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.id || !companyId) return;

        console.log('Fetching quotes for companyId:', companyId); // Add log to check companyId

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Quotes:', data);
            setQuotes(data);
        }
    }, [session, companyId, supabase]);

    const fetchAssignedSalesUser = useCallback(async () => {
        if (!companyId) return;

        const { data, error } = await supabase
            .from('company_sales_users')
            .select('sales_user_id')
            .eq('company_id', companyId)
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
                length: quote.length?.toString() || null,
                width: quote.width?.toString() || null,
                height: quote.height?.toString() || null,
                weight: quote.weight?.toString() || null,
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
                length: order.length?.toString() || null,
                width: order.width?.toString() || null,
                height: order.height?.toString() || null,
                weight: order.weight?.toString() || null,
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
        setOrders([...orders, ...(shippingQuoteData || [])]);

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
        <div className="w-full h-full overflow-auto">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center gap-2 mb-4'>
                    <button onClick={() => setIsModalOpen(true)} className="text-ntsLightBlue text-lg underline cursor-point font-semibold md:body-btn">
                        {activeTab === 'orders' ? 'Request a Shipping Order' : 'Request a Shipping Estimate'}
                    </button>
                </div>
            </div>

            {activeTab === 'orders' ? (
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
            ) : (
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
            )}

            {isMobile ? (
                <div className="relative z-0">
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md relative z-0"
                        value={activeTab}
                        onChange={(e) => handleTabChange(e.target.value)}
                    >
                        <option value="requests">Shipping Requests</option>
                        <option value="orders">Shipping Orders</option>
                        <option value="history">Completed Orders</option>
                        <option value="rejected">Rejected RFQ&apos;s</option>
                        <option value="editHistory">Edit History</option>
                    </select>
                </div>
            ) : (
                <div className="flex gap-1 relative z-0 border-b text-nowrap border-gray-300">
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'requests' ? 'bg-ntsBlue text-white border-2 border-t-orange-500' : 'bg-zinc-200'}`}
                        onClick={() => handleTabChange('requests')}
                    >
                        Shipping Requests
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'orders' ? 'bg-ntsBlue text-white border-2 border-t-orange-500' : 'bg-zinc-200'}`}
                        onClick={() => handleTabChange('orders')}
                    >
                        Shipping Orders
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'delivered' ? 'bg-ntsBlue text-white border-2 border-t-orange-500' : 'bg-zinc-200'}`}
                        onClick={() => handleTabChange('delivered')}
                    >
                        Completed Orders
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'archived' ? 'bg-ntsBlue text-white border-2 border-t-orange-500' : 'bg-zinc-200'}`}
                        onClick={() => handleTabChange('archived')}
                    >
                        Archived
                    </button>
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md ${activeTab === 'rejected' ? 'bg-ntsBlue text-white border-2 border-t-orange-500' : 'bg-zinc-200'}`}
                        onClick={() => handleTabChange('rejected')}
                    >
                        Rejected RFQ&apos;s
                    </button>
                </div>
            )}
            <div className="p-4 bg-white ">
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
                    />
                )}
            </div>
        </div>
    );
};

export default QuoteRequest;