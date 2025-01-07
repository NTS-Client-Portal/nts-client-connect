import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey);

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const assignSalesUser = async (companyId: string) => {
    try {
        // Default sales user ID
        const defaultSalesUserId = '52a7d630-a8cc-48cf-be7d-5188a956e2e5';

        // Assign the default sales user to the new company
        const { error: assignError } = await supabase
            .from('company_sales_users')
            .insert({ company_id: companyId, sales_user_id: defaultSalesUserId });

        if (assignError) {
            throw new Error(`Error assigning sales user: ${assignError.message}`);
        }

        console.log(`Assigned default sales user ${defaultSalesUserId} to company ${companyId}`);
    } catch (error) {
        console.error('Error in assignSalesUser:', error.message);
        throw error;
    }
};