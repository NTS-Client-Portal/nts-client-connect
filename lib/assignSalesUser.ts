import { createAdminClient } from './supabase/server';

const supabase = createAdminClient();

export const assignSalesUser = async (companyId: string) => {
    try {
        // Default sales user ID
        const defaultSalesUserId = 'e0718128-235b-4f41-ac6c-31ee0435c64e';

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