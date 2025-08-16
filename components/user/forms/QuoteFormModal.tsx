import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteForm from '../QuoteForm';
import { Plus, FileText, Package } from 'lucide-react';

interface QuoteRequestProps {
    session: Session | null;
    profiles: Database['public']['Tables']['profiles']['Row'][];
    companyId: string;
    userType: 'shipper' | 'broker';
}

const QuoteRequest: React.FC<QuoteRequestProps> = ({ session, profiles = [], companyId, userType }) => {
    const supabase = useSupabaseClient<Database>();
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [orders, setOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const router = useRouter();
    const { tab, searchTerm: searchTermParam, searchColumn: searchColumnParam } = router.query;
    const [activeTab, setActiveTab] = useState<string>(tab as string || 'requests');
    const [assignedSalesUser, setAssignedSalesUser] = useState<string>('');

    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.id || !companyId) return;

        console.log('Fetching quotes of company');

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

    return (
        <div className="w-full h-full">
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="nts-button-primary group relative overflow-hidden"
            >
                <div className="flex items-center gap-2">
                    {activeTab === 'orders' ? (
                        <>
                            <Package className="w-4 h-4" />
                            <span>Request Shipping Order</span>
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4" />
                            <span>Request Shipping Estimate</span>
                        </>
                    )}
                    <Plus className="w-4 h-4 ml-1" />
                </div>
                
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>

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
        </div>
    );
};

export default QuoteRequest;