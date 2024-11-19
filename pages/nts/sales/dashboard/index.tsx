import SalesLayout from '../_components/layout/SalesLayout';
import SalesDashboard from '../_components/SalesDashboard';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { UserProvider } from '@/context/UserContext';

const SalesDashboardPage = () => {
  const session = useSession();

  if (!session) {
    return <p>Loading...</p>; // or redirect to login page
  }

  return (
    <UserProvider>
      <SalesLayout>
        <SalesDashboard session={session}/>
      </SalesLayout>
    </UserProvider>
  );
};

export default SalesDashboardPage;