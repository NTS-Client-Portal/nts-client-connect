import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
import { useEffect, useState } from 'react';

const withManagerRole = (WrappedComponent) => {
  function WithManagerRole(props) {
    const session = useSession();
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [isManager, setIsManager] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkUserRole = async () => {
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('team_role')
          .eq('id', session.user.id)
          .single();

        if (error || profile.team_role !== 'manager') {
          router.push('/unauthorized'); // Redirect to an unauthorized page or home page
        } else {
          setIsManager(true);
        }

        setLoading(false);
      };

      checkUserRole();
    }, [session, supabase, router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    return isManager ? <WrappedComponent {...props} /> : null;
  }
  
  WithManagerRole.displayName = 'WithManagerRole';
  return WithManagerRole;
};

export default withManagerRole;