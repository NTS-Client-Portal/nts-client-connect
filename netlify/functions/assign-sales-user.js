const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

exports.handler = async (event, context) => {
    try {
        const { companyId } = JSON.parse(event.body);

        // Default sales user ID
        const defaultSalesUserId = process.env.NEXT_PUBLIC_DEFAULT_BROKERID;

        // Assign the default sales user to the new company
        const { error: assignError } = await supabase
            .from('company_sales_users')
            .insert({ company_id: companyId, sales_user_id: defaultSalesUserId });

        if (assignError) {
            throw new Error(`Error assigning sales user: ${assignError.message}`);
        }

        console.log(`Assigned default sales user ${defaultSalesUserId} to company ${companyId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Sales user assigned successfully' }),
        };
    } catch (error) {
        console.error('Error in assignSalesUser:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};