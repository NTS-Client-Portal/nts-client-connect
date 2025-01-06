import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, role, first_name, last_name, phone_number, office } = req.body;

  if (!email || !role || !first_name || !last_name) {
    return res.status(400).json({ error: 'Email, role, first name, and last name are required' });
  }

  try {
    // Sign up the user in Supabase Auth
    const { data, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD, // Use the default password from the environment variable
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    const authUserId = data.user?.id;

    if (!authUserId) {
      throw new Error('Failed to get user ID from sign-up response');
    }

    // Generate a unique ID for the new user
    const newUserId = uuidv4();

    // Insert the user into the nts_users table with the specified company_id
    const { error: insertError } = await supabaseAdmin.from('nts_users').insert({
      id: newUserId,
      email,
      role,
      first_name,
      last_name,
      phone_number,
      office,
      company_id: 'cc0e2fd6-e5b5-4a7e-b375-7c0d28e2b45d', // Set the company_id field
      inserted_at: new Date().toISOString(),
      auth_uid: authUserId,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    res.status(200).json({ message: 'NTS User added successfully' });
  } catch (error) {
    console.error('Error adding NTS User:', error.message);
    res.status(500).json({ error: error.message });
  }
}