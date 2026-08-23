import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import type { AppProps } from 'next/app';
import '../styles/app.css';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import { DocumentNotificationProvider } from '@/context/DocumentNotificationContext';
import { supabase } from '@/lib/initSupabase';

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { pathname, replace } = router;
  const session = useSession();
  const supabaseClient = useSupabaseClient();
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setUserType('profile');
          return;
        }

        const { data: ntsUser } = await supabaseClient
          .from('nts_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (ntsUser) {
          setUserType('nts_user');
          return;
        }

        // Neither a shipper profile nor an NTS (broker) record yet.
        // This is an incomplete shipper: send them to profile setup.
        setUserType('profile');
        if (pathname !== '/profile-setup') {
          replace('/profile-setup');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserType(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, supabaseClient, pathname, replace]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DocumentNotificationProvider>
      <NtsUsersProvider>
        <ProfilesUserProvider>
          <Component {...pageProps} />
        </ProfilesUserProvider>
      </NtsUsersProvider>
    </DocumentNotificationProvider>
  );
}

function MyApp(props: AppProps) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AppContent {...props} />
    </SessionContextProvider>
  );
}

export default MyApp;
