import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';
import type { AppProps } from 'next/app';
import '@/styles/app.css';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isNtsRoute = router.pathname.startsWith('/nts');
  const session = useSession();
  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    const checkSessionExpiration = async () => {
      if (session) {
        const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
        if (!currentSession) {
          router.push('/login');
        }
      }
    };

    const interval = setInterval(checkSessionExpiration, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [session, supabaseClient, router]);

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <DarkModeProvider>
        {isNtsRoute ? (
          <NtsUsersProvider>
            <Component {...pageProps} />
          </NtsUsersProvider>
        ) : (
          <ProfilesUserProvider>
            <Component {...pageProps} />
          </ProfilesUserProvider>
        )}
      </DarkModeProvider>
    </SessionContextProvider>
  );
}

export default MyApp;