import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import AdminLogin from '@/components/admin/AdminLogin';

const AdminSignIn = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  return <AdminLogin />;
};

export default AdminSignIn;