import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import Image from 'next/image';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import ShipperBrokerConnect from '@/components/ShipperBrokerConnect';
import FloatingChatWidget from '@/components/FloatingChatWidget';
import ShippingCalendar from './ShippingCalendar';
import { ChatProvider } from '@/context/ChatContext';

type NtsUsersRow = Database['public']['Tables']['nts_users']['Row'];
type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];

const ShipperDash = () => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [analytics, setAnalytics] = useState<Database | null>(null);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [quoteIds, setQuoteIds] = useState<string[]>([]);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [broker, setBroker] = useState<NtsUsersRow | null>(null);
    const { userProfile } = useProfilesUser();
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const session = useSession();

    const fetchOrders = useCallback(async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session?.user.id)
            .eq('status', 'Order')
            .or('is_archived.is.null,is_archived.eq.false');

        if (error) {
            console.error('Error fetching orders:', error.message);
            setErrorText('Error fetching orders');
            return;
        }

        setQuotes(data);
    }, [session?.user.id]);

    const fetchDeliveredOrders = useCallback(async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session?.user.id)
            .eq('is_complete', true);

        if (error) {
            console.error('Error fetching delivered orders:', error.message);
            setErrorText('Error fetching delivered orders');
            return;
        }

        setQuotes(data);
    }, [session?.user.id]);

    useEffect(() => {
        if (session) {
            fetchOrders();
            fetchDeliveredOrders();
        }
    }, [session, fetchOrders, fetchDeliveredOrders]);

    const NtsBrokerPicture = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/nts_users/noah-profile.png?t=2024-12-24T23%3A54%3A10.034Z`;

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                        sales_user_id,
                        nts_users (
                            id
                        )
                    `)
                    .eq('company_id', userProfile.company_id);

                if (error) {
                    console.error('Error fetching assigned sales users:', error.message);
                } else if (data) {
                    setAssignedSalesUsers(data.map((item: any) => item.nts_users));
                }
            }
        };

        fetchAssignedSalesUsers();
    }, [userProfile]);

    useEffect(() => {
        if (!userProfile) return;

        const channel = supabase
            .channel(`public:chat_requests:shipper_id=eq.${userProfile.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_requests' },
                (payload: { new: { broker_id: string; accepted: boolean; id: string } }) => {
                    if (payload.new.broker_id && payload.new.accepted) {
                        setActiveChatId(payload.new.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile]);

    return (
        <div className='container mx-auto'>
            <div className='flex sm:flex-col-reverse xl:flex-row items-start gap-6'>
                <div className='mt-4 flex gap-2 justify-start items-start'>
                    <div className="p-8 bg-gray-100 shadow rounded-lg max-w-lg max-h-96 overflow-auto">
                        <h2 className="text-xl font-bold mb-2">Active Orders</h2>
                        <div className='mb-4'>
                            <Link className="text-ntsLightBlue font-semibold underline" href={`/user`}>
                                View Orders
                            </Link>
                        </div>
                        <div>
                            <div>
                                <h3 className="text-lg font-semibold"></h3>
                                <div className='mb-2 w-full'>
                                    <ul className='flex flex-col gap-2'>
                                        {quotes.filter(quote => quote.status === 'Order').length > 0 ? (
                                            quotes.filter(quote => quote.status === 'Order').map((quote) => (
                                                <li key={quote.id} className="mb-2 flex flex-col gap-1">
                                                    <p><strong>ID:</strong> {quote.id} <strong>Status:</strong> {quote.status}</p>
                                                    <p>{quote.make && quote.model ? (`${quote.make} ${quote.model}`
                                                    ) : quote.container_type ? (`${quote.container_length} ${quote.container_type}`) : ("N/A")}
                                                    </p>
                                                </li>
                                            ))
                                        ) : (
                                            <p>No Active Orders</p>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ShippingCalendar />
                </div>

                {assignedSalesUsers.map((user, index) => (
                    <div key={index} className="broker-card flex text-nowrap flex-col justify-center items-center p-4 bg-white shadow rounded-lg w-fit max-h-96">
                        <h2 className='text-xl underline font-bold mb-4'>Your Logistics Representative</h2>
                        <Image src={NtsBrokerPicture} alt="Profile Picture" className="avatar" width={100} height={100} />
                        <h2 className='text-xl underline font-semibold mb-4'>{user.first_name} {user.last_name}</h2>
                        <span className="flex flex-col gap-1 justify-start items-start">
                            <p><strong>Phone: </strong>{user.phone_number}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                        </span>
                        {userProfile && session && (
                            <>
                                <ShipperBrokerConnect
                                    brokerId={assignedSalesUsers[0]?.id || ''}
                                    shipperId={userProfile.id}
                                    session={session}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ShipperDash;