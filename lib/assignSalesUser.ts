import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const assignSalesUser = async (companyId: string) => {
    try {
        // Fetch the list of sales users from nts_users
        const { data: users, error: fetchError } = await supabase
            .from('nts_users')
            .select('id')
            .eq('role', 'sales');

        if (fetchError) {
            throw new Error(`Error fetching users: ${fetchError.message}`);
        }

        if (!users || users.length === 0) {
            throw new Error('No sales users found');
        }

        // Fetch the list of companies to determine the next user in round-robin order
        const { data: companies, error: companiesError } = await supabase
            .from('company_sales_users')
            .select('sales_user_id');

        if (companiesError) {
            throw new Error(`Error fetching companies: ${companiesError.message}`);
        }

        // Determine the next user in round-robin order
        const lastAssignedUser = companies?.[companies.length - 1]?.sales_user_id;
        const lastAssignedIndex = users.findIndex(user => user.id === lastAssignedUser);
        const nextAssignedIndex = (lastAssignedIndex + 1) % users.length;
        const nextUser = users[nextAssignedIndex];

        // Assign the determined user to the new company
        const { error: assignError } = await supabase
            .from('company_sales_users')
            .insert({ company_id: companyId, sales_user_id: nextUser.id });

        if (assignError) {
            throw new Error(`Error assigning user: ${assignError.message}`);
        }

        console.log(`Assigned user ${nextUser.id} to company ${companyId}`);
    } catch (error) {
        console.error('Error assigning user:', error);
    }
};