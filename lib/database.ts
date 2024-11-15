import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import dotenv from 'dotenv';
import { Company, Vendor, PurchaseOrder } from '@/lib/database.types';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function fetchAllQuotes() {
    const { data, error } = await supabase
        .from('shippingquotes')
        .select('*');

    if (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }

    console.log('Fetched Quotes:', data); // Add this line for debugging

    return data;
}

export async function fetchAllUsers() {
    const { data, error } = await supabase
        .from('shippingquotes')
        .select('user_id, first_name, last_name, email');

    if (error) {
        console.error('Error fetching users from shippingquotes:', error);
        return [];
    }

    // Extract unique users
    const uniqueUsers = data.reduce((acc: any, quote: any) => {
        if (!acc.some((q: any) => q.user_id === quote.user_id)) {
            acc.push({
                user_id: quote.user_id,
                first_name: quote.first_name,
                last_name: quote.last_name,
                email: quote.email,
            });
        }
        return acc;
    }, []);

    console.log('Fetched Users:', uniqueUsers); // Add this line for debugging

    return uniqueUsers;
}

export async function fetchFreightData(freightId: number) {
    const { data, error } = await supabase
        .from('freight')
        .select('*')
        .eq('id', freightId)
        .single<Database['public']['Tables']['freight']['Row']>(); // Explicitly define the type here

    if (error) {
        console.error('Error fetching freight data:', error);
        return null;
    }

    return data;
}

export async function addFreightItem(freight: Database['public']['Tables']['freight']['Insert']): Promise<Database['public']['Tables']['freight']['Row'] | null> {
    try {
        const { data, error } = await supabase
            .from('freight')
            .insert([freight])
            .select()
            .single<Database['public']['Tables']['freight']['Row']>(); // Explicitly define the type here

        if (error) {
            console.error('Error adding freight item:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in addFreightItem:', error);
        throw error;
    }
}

export async function checkDuplicateInventoryNumber(inventoryNumber: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('freight')
        .select('id')
        .eq('inventory_number', inventoryNumber);

    if (error) {
        console.error('Error checking duplicate inventory number:', error);
        throw error;
    }

    return data.length > 0;
}

// New functions for companies table

export async function fetchCompanyByName(companyName: string): Promise<Company | null> {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('name', companyName)
        .maybeSingle<Company>(); // Use maybeSingle to handle no rows returned

    if (error) {
        console.error('Error fetching company by name:', error);
        return null;
    }

    return data;
}

export async function addCompany(companies: Database['public']['Tables']['companies']['Insert']): Promise<Database['public']['Tables']['companies']['Row'] | null> {
    try {
        const { data, error } = await supabase
            .from('companies')
            .insert([companies])
            .select()
            .single<Company>(); // Explicitly define the type here

        if (error) {
            console.error('Error adding company:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in addCompany:', error);
        throw error;
    }
}

export async function updateFavoriteStatus(documentId: number, isFavorite: boolean): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
        .from('documents')
        .update({ is_favorite: isFavorite })
        .eq('id', documentId);

    return { data, error };
}

export async function fetchVendorsData() {
    const { data, error } = await supabase
        .from('vendors')
        .select('id, vendornumber, vendorname, businessstreet, businesscity, businessstate, email, phone');

    if (error) {
        console.error('Error fetching vendors:', error);
        return { data: [], error };
    }

    return { data, error };
}

export async function addVendor(vendors: Omit<Vendor, 'id'>) {
    const { data, error } = await supabase
        .from('vendors')
        .insert([vendors])
        .select();

    return { data, error };
}

export async function addPurchaseOrder(purchaseOrder: Omit<PurchaseOrder, 'id'>) {
    const { data, error } = await supabase
        .from('purchase_order')
        .insert([purchaseOrder])
        .select();

    return { data, error };
}

export async function fetchPurchaseOrders(userId: string) {
    const { data, error } = await supabase
        .from('purchase_order')
        .select('id, ponumber, status, createddate, expecteddate, vendornumber, vendorname, order_description, user_id')
        .eq('user_id', userId); // Filter by user_id

    if (error) {
        console.error('Error fetching purchase orders:', error);
        return { data: [], error };
    }

    return { data, error };
}

export async function updatePurchaseOrderStatus(id: number, status: string) {
    const { data, error } = await supabase
        .from('purchase_order')
        .update({ status })
        .eq('id', id);

    return { data, error };
}

