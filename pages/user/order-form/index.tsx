import React, { useState, useEffect, useCallback } from 'react';
import OrderPage from '@/components/user/OrderPage';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import UserLayout from '@/pages/components/UserLayout';

const OrderFormPage: React.FC = () => {
    const session = useSession();
    const router = useRouter();
    const supabase = useSupabaseClient<Database>();
    const { userProfile: profilesUser } = useProfilesUser();
    const [companyId, setCompanyId] = useState<string>('');
    const [assignedSalesUser, setAssignedSalesUser] = useState<string>('');
    const [ntsUserProfile, setNtsUserProfile] = useState<Database['public']['Tables']['nts_users']['Row'] | null>(null);

    const handleClose = () => {
        router.push('/'); // Redirect to the home page or any other page
    };

    const fetchOrders = async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Error fetching orders:', error.message);
        } else {
            console.log('Fetched Orders:', data);
        }
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
            return;
        }

        console.log('Order added successfully:', shippingQuoteData);
        fetchOrders();
    };

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

        setCompanyId(profile.company_id);
    }, [session, supabase]);

    const fetchNtsUserProfile = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data: ntsUser, error } = await supabase
            .from('nts_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching NTS user profile:', error.message);
            return;
        }

        setNtsUserProfile(ntsUser);
    }, [session, supabase]);

    useEffect(() => {
        fetchUserProfile();
        fetchNtsUserProfile();
    }, [fetchUserProfile, fetchNtsUserProfile]);

    useEffect(() => {
        if (session?.user?.id) {
            setAssignedSalesUser(session.user.id);
        }
    }, [session]);

    return (
        <UserLayout>
            <OrderPage
                onClose={handleClose}
                addOrder={addOrder}
                errorText=""
                setErrorText={() => {}}
                session={session}
                companyId={companyId}
                fetchOrders={fetchOrders}
                assignedSalesUser={assignedSalesUser}
            />
        </UserLayout>
    );
};

export default OrderFormPage;