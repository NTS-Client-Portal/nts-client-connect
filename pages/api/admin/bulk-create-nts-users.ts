/**
 * Bulk NTS user creation API endpoint
 * Useful for onboarding multiple sales reps at once
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface BulkUserData {
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  extension?: string;
  office?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { users }: { users: BulkUserData[] } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const results = {
      success: [],
      failed: [],
      total: users.length
    };

    const companyId = process.env.NEXT_PUBLIC_NTS_COMPANYID;

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.email || !userData.role || !userData.first_name || !userData.last_name) {
          results.failed.push({
            email: userData.email || 'unknown',
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if email already exists
        const { data: existingUser } = await supabaseAdmin
          .from('nts_users')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (existingUser) {
          results.failed.push({
            email: userData.email,
            error: 'Email already exists'
          });
          continue;
        }

        // Generate temporary password
        const temporaryPassword = `NTS${Date.now().toString().slice(-4)}!${userData.first_name.charAt(0)}`;

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            created_by_admin: true,
            bulk_created: true
          }
        });

        if (authError || !authUser.user) {
          results.failed.push({
            email: userData.email,
            error: authError?.message || 'Failed to create auth user'
          });
          continue;
        }

        // Create NTS user record
        const { data: ntsUser, error: ntsError } = await supabaseAdmin
          .from('nts_users')
          .insert({
            id: authUser.user.id,
            email: userData.email,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number,
            extension: userData.extension,
            office: userData.office,
            company_id: companyId,
            inserted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (ntsError) {
          // Cleanup auth user if NTS user creation fails
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          results.failed.push({
            email: userData.email,
            error: ntsError.message
          });
          continue;
        }

        // Generate password reset link
        const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: userData.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nts-set-password`
          }
        });

        results.success.push({
          email: userData.email,
          user: ntsUser,
          temporary_password: temporaryPassword,
          reset_link: resetData?.properties?.action_link
        });

      } catch (error) {
        results.failed.push({
          email: userData.email || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: results.success.length > 0,
      created: results.success.length,
      failed: results.failed.length,
      total: results.total,
      results
    });

  } catch (error) {
    console.error('Bulk creation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
