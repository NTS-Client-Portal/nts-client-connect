import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/initSupabase'; // Import the Supabase client from initSupabase
import type { AppProps } from 'next/app';
import { UserProvider } from '../context/UserContext'; // Adjust the import path as needed
import '@/styles/app.css';
import { DarkModeProvider } from '@/context/DarkModeContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <DarkModeProvider>
        <UserProvider>
          <Component {...pageProps} />
        </UserProvider>
      </DarkModeProvider>
    </SessionContextProvider>
  );
}