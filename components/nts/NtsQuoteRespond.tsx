import React, { useState, useEffect } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import NtsQuoteList from './NtsQuoteList';

interface NtsQuoteRespondProps {
    session: Session | null;
}

const NtsQuoteRespond: React.FC<NtsQuoteRespondProps> = ({ session }) => {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);

    const fetchQuotes = async () => {
        if (!session?.user?.id) {
            console.error('Session user ID is undefined');
            return;
        }

        console.log('Session:', session);

        // Fetch company IDs assigned to the sales user
        const { data: companyIdsData, error: companyIdsError } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .eq('sales_user_id', session.user.id);

        if (companyIdsError) {
            console.error('Error fetching company IDs:', companyIdsError.message);
            return;
        }

        const companyIds = companyIdsData.map((item: { company_id: string }) => item.company_id);

        if (companyIds.length === 0) {
            setQuotes([]);
            return;
        }

        // Fetch quotes for the assigned companies
        const { data: quotesData, error: quotesError } = await supabase
            .from('shippingquotes')
            .select(`
                id,
                assigned_sales_user,
                auction,
                beam,
                buyer_number,
                class_type,
                commodity,
                company_id,
                container_length,
                container_type,
                contents_description,
                cradle,
                destination_city,
                destination_state,
                destination_street,
                destination_surface_type,
                destination_type,
                destination_type_description,
                destination_zip,
                dock_no_dock,
                driveaway_or_towaway,
                due_date,
                email,
                first_name,
                freight_class,
                freight_type,
                goods_value,
                height,
                inserted_at,
                is_archived,
                is_complete,
                is_loaded,
                last_name,
                length,
                load_description,
                loading_assistance,
                loading_by,
                loading_unloading_requirements,
                lot_number,
                make,
                model,
                motorized_or_trailer,
                notes,
                operational_condition,
                origin_address,
                origin_city,
                origin_state,
                origin_surface_type,
                origin_type,
                origin_type_description,
                origin_zip,
                packaging_type,
                pallet_count,
                price,
                roadworthy,
                save_to_inventory,
                shipment_items,
                status,
                tarping,
                trailer,
                type,
                unloading_by,
                user_id,
                vin,
                weight,
                weight_per_pallet_unit,
                width,
                year,
                companies (
                    company_name,
                    company_size
                )
            `)
            .in('company_id', companyIds);

        if (quotesError) {
            console.error('Error fetching quotes:', quotesError.message);
        } else {
            console.log('Fetched Quotes:', quotesData);
            setQuotes(quotesData);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, [session]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); // Set initial value
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="w-full h-full overflow-auto">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center gap-2 mb-4'>
                    <h1 className="xs:text-md mb-2 text-xl md:text-2xl font-medium text-center underline underline-offset-8">Respond to Shipping Quotes</h1>
                </div>
            </div>
            {isMobile ? (
                <div className="relative">
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value="requests"
                        onChange={(e) => { }}
                    >
                        <option value="requests">Shipping Requests</option>
                    </select>
                </div>
            ) : (
                <div className="flex gap-1 border-b border-gray-300">
                    <button
                        className={`w-full px-12 py-2 -mb-px text-sm font-medium text-center border rounded-t-md bg-zinc-700 text-white border-zinc-500`}
                    >
                        Shipping Requests
                    </button>
                </div>
            )}
            <div className="p-4 bg-white border border-gray-300 rounded-b-md">
                <NtsQuoteList session={session} quotes={quotes} />
            </div>
        </div>
    );
};

export default NtsQuoteRespond;