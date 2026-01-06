import { createServerClient } from '@supabase/ssr';
import { NextApiRequest } from 'next';
import { Database } from '../database.types';

/**
 * Creates a Supabase client for server-side API routes with cookie handling
 */
export function createClient(req: NextApiRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({
            name,
            value: req.cookies[name] || '',
          }));
        },
        setAll(cookiesToSet) {
          // Cookie setting handled by middleware
        },
      },
      global: {
        headers: {
          Authorization: req.headers.authorization || '',
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role key for server-side operations
 * Use with caution - bypasses RLS policies
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
