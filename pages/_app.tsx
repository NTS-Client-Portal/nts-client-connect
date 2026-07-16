import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import type { AppProps } from 'next/app';
import '../styles/app.css';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import { DocumentNotificationProvider } from '@/context/DocumentNotificationContext';
import { supabase } from '@/lib/initSupabase';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const session = useSession();
  const supabaseClient = useSupabaseClient();
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session) {
        try {
          const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUserType('profile');
          } else {
            const { data: ntsUser, error: ntsError } = await supabaseClient
              .from('nts_users')
              .select('email')
              .eq('email', session.user.email)
              .single();

            if (ntsUser) {
              setUserType('nts_user');
            } else {
              setUserType(null);
              router.push('/unauthorized');
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserType(null);
          router.push('/unauthorized');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, supabaseClient, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <DocumentNotificationProvider>
        {/*
          Always mount BOTH user-profile providers. Components like
          QuoteRequest call `useProfilesUser()` and `useNtsUsers()`
          unconditionally, so if only one provider is mounted the
          other hook throws and produces a client-side exception
          (e.g. brokers loading /companies/[companyId]).
          Each provider only fetches when its own table has a row
          matching the session, so having both mounted is safe.
        */}
        <NtsUsersProvider>
          <ProfilesUserProvider>
            <Component {...pageProps} />
          </ProfilesUserProvider>
        </NtsUsersProvider>
      </DocumentNotificationProvider>
    </SessionContextProvider>
  );
}

export default MyApp;
