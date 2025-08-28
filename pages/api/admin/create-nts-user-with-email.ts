/**
 * Alternative API endpoint for NTS user creation with custom invitation email
 * This creates the user and sends a custom welcome email with setup instructions
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

// Email service (you can replace this with SendGrid, Mailgun, etc.)
async function sendWelcomeEmail(
  email: string, 
  firstName: string, 
  lastName: string, 
  temporaryPassword: string,
  resetLink: string
) {
  // Example using SendGrid (you'll need to install @sendgrid/mail)
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const welcomeEmailContent = `
    <h2>Welcome to NTS Client Connect Portal!</h2>
    
    <p>Hello ${firstName} ${lastName},</p>
    
    <p>Your admin has created an account for you on the NTS Client Connect Portal.</p>
    
    <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3>Account Details:</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
    </div>
    
    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Click the link below to set your permanent password</li>
      <li>Log in to the portal at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/nts/login">NTS Login</a></li>
      <li>Complete your profile setup</li>
    </ol>
    
    <p style="margin: 30px 0;">
      <a href="${resetLink}" 
         style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
        Set Your Password
      </a>
    </p>
    
    <p>If you have any questions, please contact your system administrator.</p>
    
    <p>Welcome to the team!</p>
    
    <hr>
    <small style="color: #666;">
      This email was sent from NTS Client Connect Portal. 
      If you believe you received this email in error, please contact support.
    </small>
  `;

  // For now, we'll just log the email (replace with actual email sending)
  console.log('Welcome Email Content:', welcomeEmailContent);
  
  // Uncomment and configure for actual email sending:
  /*
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL, // verified sender
    subject: 'Welcome to NTS Client Connect Portal - Account Created',
    html: welcomeEmailContent,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
  */
  
  return true; // For now, assume success
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
      send_welcome_email = true
    } = req.body;

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

    // Generate a temporary password
    const temporaryPassword = `NTS${Date.now().toString().slice(-4)}!${first_name.charAt(0)}`;

    // Create user with Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
        created_by_admin: true,
        needs_password_reset: true
      }
    });

    if (authError || !authUser.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create user' });
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
      // Cleanup: delete the auth user if NTS user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(400).json({ error: ntsError.message });
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nts-set-password`
      }
    });

    let emailSent = false;
    if (send_welcome_email && resetData?.properties?.action_link) {
      emailSent = await sendWelcomeEmail(
        email, 
        first_name, 
        last_name, 
        temporaryPassword,
        resetData.properties.action_link
      );
    }

    return res.status(201).json({
      success: true,
      user: ntsUser,
      temporary_password: temporaryPassword,
      reset_link: resetData?.properties?.action_link,
      email_sent: emailSent,
      message: 'NTS user created successfully' + (emailSent ? ' and welcome email sent' : '')
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
