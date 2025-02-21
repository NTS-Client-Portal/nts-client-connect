// filepath: /pages/protected.js
import { useSession, getSession } from 'next-auth/react';
import { supabase } from '@/lib/initSupabase';

export default function ProtectedPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;

  if (!session) {
    return <p>You must be signed in to view this page</p>;
  }

  // Example of fetching data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from('nts_users').select('*');
    if (error) {
      console.error(error);
    }
    console.log(data);
  };

  fetchData();

  return <p>Welcome, {session.user.email}</p>;
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}