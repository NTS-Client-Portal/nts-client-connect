import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Image from 'next/image';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import ShippingCalendar from './ShippingCalendar';
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

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                        sales_user_id,
                            nts_users (
                                id,
                                first_name,
                                last_name,
                                email,
                                phone_number,
                                profile_picture
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
            <div className='flex flex-col-reverse xl:flex-row items-center md:items-start gap-6'>
                <div className='px-4 w-full'><ShippingCalendar /></div>
                {assignedSalesUsers.map((user, index) => (
                    <div key={index} className="broker-card flex text-nowrap flex-col justify-center items-center p-4 bg-white shadow rounded-lg w-[97vw] md:w-fit max-h-96">
                        <h2 className='text-xl underline font-bold mb-4'>Your Logistics Representative</h2>
                        {user.profile_picture ? (
                            <Image
                                src={`${user.profile_picture}`}
                                alt="Profile Picture"
                                className="avatar"
                                width={100}
                                height={100}
                            />
                        ) : (
                            <div className="avatar-placeholder w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500">No Image</span>
                            </div>
                        )}
                        <h2 className='text-xl underline font-semibold mb-4'>{user.first_name} {user.last_name}</h2>
                        <span className="flex flex-col gap-1 justify-start items-start">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Phone: </strong>{user.phone_number}</p>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ShipperDash;