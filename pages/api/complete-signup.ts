import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Server-side only: creates the company + profile immediately after signup so
// the shipper never has to complete a separate profile-setup step.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const { userId, email, firstName, lastName, companyName, companySize, industry, phoneNumber } =
    req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email are required' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Find or create the company.
    let companyId: string | null = null;
    if (companyName) {
      const { data: existingCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: companyError } = await supabaseAdmin
          .from('companies')
          .insert({
            name: companyName,
            company_size: companySize || '1-10',
            industry: industry || null,
          })
          .select()
          .single();

        if (companyError) throw new Error(companyError.message);
        companyId = newCompany.id;
      }
    }

    // 2. Upsert the shipper profile (this is what lets them skip profile-setup).
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phoneNumber || null,
        company_id: companyId,
        role: 'shipper',
        team_role: 'manager',
        profile_complete: true,
      },
      { onConflict: 'id' }
    );

    if (profileError) throw new Error(profileError.message);

    // 3. Assign a sales user to the company (non-blocking).
    if (companyId) {
      let salesUserId: string | undefined = process.env.NEXT_PUBLIC_DEFAULT_BROKERID;

      if (!salesUserId) {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('nts_users')
          .select('id');

        if (!usersError && users && users.length > 0) {
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
      }

      if (salesUserId) {
        const { error: assignError } = await supabaseAdmin
          .from('company_sales_users')
          .insert({ company_id: companyId, sales_user_id: salesUserId });

        if (assignError) {
          console.error('Sales user assignment failed (non-blocking):', assignError.message);
        }
      }
    }

    res.status(200).json({ ok: true, companyId });
  } catch (error) {
    console.error('Error provisioning signup:', error.message);
    res.status(500).json({ error: error.message });
  }
}
