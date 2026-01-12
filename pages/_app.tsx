import { useEffect, useState, useRef } from 'react';
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
  const hasChecked = useRef(false);

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
    const determineUserType = async () => {
      if (!session) {
        setUserType(null);
        setLoading(false);
        hasChecked.current = false;
        return;
      }

      // Only run once per session
      if (hasChecked.current) {
        setLoading(false);
        return;
      }

      hasChecked.current = true;

      try {
        // Check profiles table first
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && !profileError) {
          console.log('User found in profiles table');
          setUserType('profile');
          setLoading(false);
          return;
        }

        // Check nts_users table
        const { data: ntsUser, error: ntsError } = await supabaseClient
          .from('nts_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (ntsUser && !ntsError) {
          console.log('User found in nts_users table');
          setUserType('nts_user');
          setLoading(false);
          return;
        }

        // User not found in either table - only redirect if not already on unauthorized page
        console.warn('User not found in any table');
        setUserType(null);
        setLoading(false);
        
        if (router.pathname !== '/unauthorized' && router.pathname !== '/login' && router.pathname !== '/') {
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Error determining user type:', error);
        setUserType(null);
        setLoading(false);
        
        if (router.pathname !== '/unauthorized' && router.pathname !== '/login' && router.pathname !== '/') {
          router.push('/unauthorized');
        }
      }
    };

    determineUserType();
  }, [session?.user?.id, supabaseClient, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DocumentNotificationProvider>
      {userType === 'nts_user' ? (
        <NtsUsersProvider>
          <Component {...pageProps} />
        </NtsUsersProvider>
      ) : userType === 'profile' ? (
        <ProfilesUserProvider>
          <Component {...pageProps} />
        </ProfilesUserProvider>
      ) : (
        // No user type (public pages) - don't wrap in user context providers
        <Component {...pageProps} />
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