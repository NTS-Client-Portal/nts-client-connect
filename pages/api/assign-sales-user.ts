import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Server-side only: the service role key must never reach the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Default sales user ID (allow environment override).
    const defaultSalesUserId =
      process.env.NEXT_PUBLIC_DEFAULT_BROKERID || 'e0718128-235b-4f41-ac6c-31ee0435c64e';

    const { error: assignError } = await supabaseAdmin
      .from('company_sales_users')
      .insert({ company_id: companyId, sales_user_id: defaultSalesUserId });

    if (assignError) {
      throw new Error(assignError.message);
    }

    res.status(200).json({ message: 'Sales user assigned successfully' });
  } catch (error) {
    console.error('Error assigning sales user:', error.message);
    res.status(500).json({ error: error.message });
  }
}
