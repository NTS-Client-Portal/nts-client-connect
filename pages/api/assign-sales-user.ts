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

    // Prefer the configured default broker, otherwise fall back to an
    // existing sales user via round-robin. Never depend on a hardcoded
    // UUID that may not exist in nts_users (that caused a 500 + FK error).
    let salesUserId: string | undefined = process.env.NEXT_PUBLIC_DEFAULT_BROKERID;

    if (!salesUserId) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('nts_users')
        .select('id');

      if (usersError) {
        throw new Error(usersError.message);
      }

      if (!users || users.length === 0) {
        return res.status(500).json({ error: 'No sales users available to assign' });
      }

      // Round-robin: assign the user after the most recently assigned one.
      const { data: latest } = await supabaseAdmin
        .from('company_sales_users')
        .select('sales_user_id')
        .order('id', { ascending: false })
        .limit(1);

      let nextIndex = 0;
      if (latest && latest.length > 0) {
        const lastIndex = users.findIndex((u) => u.id === latest[0].sales_user_id);
        nextIndex = (lastIndex + 1) % users.length;
      }
      salesUserId = users[nextIndex].id;
    }

    const { error: assignError } = await supabaseAdmin
      .from('company_sales_users')
      .insert({ company_id: companyId, sales_user_id: salesUserId });

    if (assignError) {
      throw new Error(assignError.message);
    }

    res.status(200).json({ message: 'Sales user assigned successfully', salesUserId });
  } catch (error) {
    console.error('Error assigning sales user:', error.message);
    res.status(500).json({ error: error.message });
  }
}
