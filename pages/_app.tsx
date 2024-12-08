import { useState } from 'react';
import { useRouter } from 'next/router';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/initSupabase'; // Import the Supabase client from initSupabase
import type { AppProps } from 'next/app';
import '@/styles/app.css';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isNtsRoute = router.pathname.startsWith('/nts');

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