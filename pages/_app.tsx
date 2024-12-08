import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/initSupabase'; // Import the Supabase client from initSupabase
import type { AppProps } from 'next/app';
import '@/styles/app.css';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isNtsRoute = router.pathname.startsWith('/nts');
  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const checkSessionExpiration = async () => {
      if (session) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.push('/login');
        }
      }
    };

    const interval = setInterval(checkSessionExpiration, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [session, supabase, router]);

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