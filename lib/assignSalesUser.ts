import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const assignSalesUser = async (companyId: string) => {
    try {
        // Fetch the list of sales users
        const { data: salesUsers, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'sales');

        if (fetchError) {
            throw new Error(`Error fetching sales users: ${fetchError.message}`);
        }

        if (!salesUsers || salesUsers.length === 0) {
            throw new Error('No sales users found');
        }

        // Fetch the list of companies to determine the next sales user in round-robin order
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('assigned_sales_user');

        if (companiesError) {
            throw new Error(`Error fetching companies: ${companiesError.message}`);
        }

        // Determine the next sales user in round-robin order
        const lastAssignedSalesUser = companies?.[companies.length - 1]?.assigned_sales_user;
        const lastAssignedIndex = salesUsers.findIndex(user => user.id === lastAssignedSalesUser);
        const nextAssignedIndex = (lastAssignedIndex + 1) % salesUsers.length;
        const nextSalesUser = salesUsers[nextAssignedIndex];

        // Assign the determined sales user to the new company
        const { error: assignError } = await supabase
            .from('companies')
            .update({ assigned_sales_user: nextSalesUser.id })
            .eq('id', companyId);

        if (assignError) {
            throw new Error(`Error assigning sales user: ${assignError.message}`);
        }

        console.log(`Assigned sales user ${nextSalesUser.id} to company ${companyId}`);
    } catch (error) {
        console.error('Error assigning sales user:', error);
    }
};