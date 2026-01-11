import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SupabaseProvider, useSession, useSupabaseClient } from '@/lib/supabase/provider';
import type { AppProps } from 'next/app';
import '../styles/app.css';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import { DocumentNotificationProvider } from '@/context/DocumentNotificationContext';

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const session = useSession();
  const supabaseClient = useSupabaseClient();
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

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
    <DocumentNotificationProvider>
      {userType === 'nts_user' ? (
        <NtsUsersProvider>
          <Component {...pageProps} />
        </NtsUsersProvider>
      ) : (
        <ProfilesUserProvider>
          <Component {...pageProps} />
        </ProfilesUserProvider>
      )}
    </DocumentNotificationProvider>
  );
}

function MyApp(props: AppProps) {
  return (
    <SupabaseProvider>
      <AppContent {...props} />
    </SupabaseProvider>
  );
}

export default MyApp;