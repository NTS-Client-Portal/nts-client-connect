import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteForm from './QuoteForm';
import QuoteList from './quotetabs/QuoteList';
import DeliveredList from './quotetabs/DeliveredList';
import OrderList from './quotetabs/OrderList';
import Archived from './quotetabs/Archived';
import RejectedList from './quotetabs/RejectedList';
import EditHistory from '../EditHistory'; // Adjust the import path as needed
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
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
        if (!session?.user?.id || !selectedUserId) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('assigned_sales_user', selectedUserId)
            .eq('is_archived', false); // Fetch only non-archived quotes

        if (error) {
            setErrorText(error.message);
        } else {
            console.log('Fetched Quotes:', data);
            setQuotes(data);
        }
    }, [session, selectedUserId, supabase]);

    const fetchEditHistory = useCallback(async () => {
        if (!companyId) return;

        const { data, error } = await supabase
            .from('edit_history')
            .select('*')
            .eq('company_id', companyId)
            .order('edited_at', { ascending: false });

        if (error) {
            console.error('Error fetching edit history:', error.message);
        } else {
            console.log('Fetched Edit History:', data);
            setEditHistory(data);
        }
    }, [companyId, supabase]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchUserProfile();
        }
    }, [session, fetchUserProfile]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchQuotes();
            fetchEditHistory();
        }
    }, [session, fetchQuotes, fetchEditHistory]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
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
            } else {
                setIsAdmin(!!data);
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
                company_id: companyId,
                first_name: quote.first_name || null,
                last_name: quote.last_name || null,
                email: quote.email || null,
                inserted_at: quote.inserted_at || new Date().toISOString(),
                is_complete: quote.is_complete || false,
                is_archived: quote.is_archived || false,
                year: quote.year?.toString() || null, // Ensure year is a string
                make: quote.make || null,
                model: quote.model || null,
                length: quote.length?.toString() || null, // Ensure length is a string
                width: quote.width?.toString() || null, // Ensure width is a string
                height: quote.height?.toString() || null, // Ensure height is a string
                weight: quote.weight?.toString() || null, // Ensure weight is a string
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
        setIsModalOpen(false); // Close the modal after adding the quote
        fetchQuotes(); // Fetch quotes after adding a new one
    };

    const archiveQuote = async (id: number) => {
        if (!session?.user?.id) return;

        const { error } = await supabase
            .from('shippingquotes')
            .update({ is_archived: true } as Database['public']['Tables']['shippingquotes']['Update']) // Mark the quote as archived
            .eq('id', id);

        if (error) {
            console.error('Error archiving quote:', error.message);
            setErrorText('Error archiving quote');
        } else {
            setQuotes(quotes.filter(quote => quote.id !== id));
        }
    };

    const transferToOrderList = async (quoteId: number) => {
        if (!session?.user?.id) {
            setErrorText('User is not authenticated');
            return;
        }

        try {
            // Logic to transfer the quote to the order list
            const { data, error } = await supabase
                .from('shippingquotes')
                .insert([{ quote_id: quoteId, user_id: session.user.id }]);

            if (error) {
                console.error('Error transferring quote to shippingquotes list:', error);
                setErrorText('Error transferring quote to shippingquotes list');
            } else {
                console.log('Quote transferred to shippingquotes list:', data);
                // Remove the transferred quote from the quotes array
                setQuotes(quotes.filter(quote => quote.id !== quoteId));
            }
        } catch (error) {
            console.error('Error transferring quote to shippingquotes list:', error);
            setErrorText('Error transferring quote to shippingquotes list');
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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
            router.push(`/companies/${companyId}`, undefined, { shallow: true });
        }
    };

    return (
        <div className="w-full h-full overflow-auto">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center gap-2 mb-4'>
                    <h1 className="xs:text-md mb-2 text-xl md:text-2xl font-medium text-center underline underline-offset-8">Request a Shipping Quote</h1>
                    <button onClick={() => setIsModalOpen(true)} className="body-btn">
                        {ntsUser ? 'Create Shipping Quote for Customer' : profilesUser ? 'Request a Shipping Estimate' : 'Request a Shipping Estimate'}
                    </button>
                </div>
                <div className="flex justify-center mb-4 relative z-0">
                    <label className="mr-2">Select User:</label>
                    <select
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="border relative z-0 border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="">All Users</option>
                        {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                                {profile.first_name} {profile.last_name}
                            </option>
                        ))}
                    </select>
                </div>
                <NtsUsersProvider>
                    <ProfilesUserProvider>
                        <QuoteForm
                            session={session}
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            addQuote={addQuote}
                            errorText={errorText}
                            setErrorText={setErrorText}
                            companyId={companyId} // Pass companyId to QuoteForm
                            assignedSalesUser={session?.user?.id || ''} // Pass assignedSalesUser to QuoteForm
                            fetchQuotes={fetchQuotes}

                        />
                    </ProfilesUserProvider>
                </NtsUsersProvider>
            </div>

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
                        <option value="archived">Archived</option>
                        <option value="rejected">Rejected RFQ&apos;s</option>
                        <option value="editHistory">Edit History</option>
                    </select>
                </div>
            ) : (
                <div className="flex gap-1 relative z-0 border-b border-gray-300">
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
                        Rejected RFQ&apos;
                    </button>
                </div>
            )}
            <div className="p-4 bg-white ">
                {activeTab === 'requests' && (
                    <QuoteList
                        session={session}
                        isAdmin={isAdmin}
                        selectedUserId={selectedUserId}
                    />
                )}
                {activeTab === 'orders' && (
                    <OrderList
                        session={session}
                        fetchQuotes={fetchQuotes}
                        isAdmin={isAdmin}
                        selectedUserId={selectedUserId}
                    />
                )}
                {activeTab === 'delivered' && (
                    <DeliveredList
                        session={session}
                        isAdmin={isAdmin}
                        selectedUserId={selectedUserId} // Pass selectedUserId
                    />
                )}
                {activeTab === 'archived' && (
                    <Archived
                        session={session}
                        isAdmin={isAdmin}
                        selectedUserId={selectedUserId}
                    />
                )}
                {activeTab === 'rejected' && (
                    <RejectedList
                        session={session}
                        selectedUserId={selectedUserId}
                        isAdmin={isAdmin}
                    />
                )}
            </div>
        </div>
    );
};

export default QuoteRequest;