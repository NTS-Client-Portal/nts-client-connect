import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types'; // Import the generated types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

/*
 * Session storage strategy: use sessionStorage instead of the Supabase
 * default (localStorage) so a signed-in session lives ONLY for the
 * browser tab's lifetime.
 *
 *   - Reloads within the same tab            → stay signed in.
 *   - Client-side navigation within the app  → stay signed in.
 *   - Close the tab and re-open the app      → login screen.
 *   - New tab / new browser session          → login screen.
 *
 * This kills the "silent auto-login on next visit" behavior without
 * making the app annoying to use during a session (a mid-flow F5 would
 * still keep you signed in).
 *
 * On the server (no `window`), storage is undefined and Supabase falls
 * back safely — SSR was never touching a persisted session anyway.
 */
const tabScopedStorage =
    typeof window !== 'undefined' ? window.sessionStorage : undefined;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: tabScopedStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
