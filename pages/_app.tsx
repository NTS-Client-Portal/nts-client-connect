import { useRouter } from 'next/router';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import type { AppProps } from 'next/app';
import '@/styles/app.css';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import { DocumentNotificationProvider } from '@/context/DocumentNotificationContext';
import { supabase } from '@/lib/initSupabase';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <DocumentNotificationProvider>
        {router.pathname.startsWith('/nts') ? (
          <NtsUsersProvider>
            <Component {...pageProps} />
          </NtsUsersProvider>
        ) : (
          <ProfilesUserProvider>
            <Component {...pageProps} />
          </ProfilesUserProvider>
        )}
      </DocumentNotificationProvider>
    </SessionContextProvider>
  );
}

export default MyApp;