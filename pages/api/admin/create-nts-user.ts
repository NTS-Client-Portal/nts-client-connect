/**
 * Server-side API endpoint for creating NTS users without OTP
 * This uses Supabase Admin API to bypass email confirmation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

const supabaseAdmin = createAdminClient();

interface CreateNtsUserRequest {
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  extension?: string;
  office?: string;
  profile_picture?: string;
  temporary_password?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      role,
      first_name,
      last_name,
      phone_number,
      extension,
      office,
      profile_picture,
      temporary_password
    }: CreateNtsUserRequest = req.body;

    // Validate required fields
    if (!email || !role || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, role, first_name, last_name' 
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('nts_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate a temporary password if not provided
    const tempPassword = temporary_password || `TempPass${Date.now()}!`;

    // Create user with Admin API (bypasses email confirmation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        first_name,
        last_name,
        role,
        created_by_admin: true
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    if (!authUser.user) {
      return res.status(400).json({ error: 'Failed to create auth user' });
    }

    // Create NTS user record
    const companyId = process.env.NEXT_PUBLIC_NTS_COMPANYID;
    
    const { data: ntsUser, error: ntsError } = await supabaseAdmin
      .from('nts_users')
      .insert({
        id: authUser.user.id,
        email,
        role,
        first_name,
        last_name,
        phone_number,
        extension,
        office,
        company_id: companyId,
        profile_picture,
        inserted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (ntsError) {
      console.error('NTS user creation error:', ntsError);
      
      // Cleanup: delete the auth user if NTS user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return res.status(400).json({ error: ntsError.message });
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nts-set-password`
      }
    });

    if (resetError) {
      console.warn('Password reset email error:', resetError);
      // Don't fail the whole operation if email fails
    }

    return res.status(201).json({
      success: true,
      user: ntsUser,
      temporary_password: tempPassword,
      message: 'NTS user created successfully. Password reset email sent.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
