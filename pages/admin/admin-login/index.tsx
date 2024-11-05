// admin-dash/index.tsx
import React from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/schema';
import AdminLogin from '@/components/AdminSignUp';

const AdminDashboard = () => {
  const session = useSession();
  const supabase = useSupabaseClient<Database>();

  // Add your admin dashboard functionalities here

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <AdminLogin />
    </div>
  );
};

export default AdminDashboard;