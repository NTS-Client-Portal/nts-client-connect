// =============================================
// SECURE AUTHENTICATION IMPROVEMENTS
// =============================================

// 1. Updated CustomSignInForm.tsx - Remove auto profile creation
const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      return;
    }

    if (!authData.user?.email_confirmed_at) {
      setError('Please verify your email address before signing in.');
      return;
    }

    // Check for existing profile - DO NOT auto-create
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, team_role, company_id, profile_complete')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      // Don't auto-create - redirect to profile setup or show error
      setError('Profile not found. Please contact support to activate your account.');
      return;
    }

    // Validate profile completeness
    if (!userProfile.profile_complete) {
      router.push('/profile-setup');
      return;
    }

    // Route based on validated role
    switch (userProfile.team_role) {
      case 'admin':
        router.push('/admin/admin-dashboard');
        break;
      case 'shipper':
        router.push('/user/logistics-management');
        break;
      default:
        setError('Invalid user role. Please contact support.');
        return;
    }

  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    setError('An unexpected error occurred. Please try again.');
  }
};

// 2. Server-side profile creation function (call this from API route)
export const createShipperProfile = async (supabase: any, userData: {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}) => {
  try {
    const { data, error } = await supabase.rpc('create_shipper_profile', {
      user_id: userData.userId,
      user_email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      company_name: userData.companyName
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

// 3. Enhanced role checking middleware
export const checkUserPermissions = async (supabase: any, requiredRole?: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check profiles table for shippers
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_role, profile_complete, company_id')
      .eq('id', user.id)
      .single();

    // Check nts_users table for NTS staff
    const { data: ntsUser } = await supabase
      .from('nts_users')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    const userRole = profile?.team_role || ntsUser?.role;
    const isComplete = profile?.profile_complete !== false; // Default true for nts_users

    if (!userRole) {
      throw new Error('No valid role found');
    }

    if (!isComplete) {
      throw new Error('Profile incomplete');
    }

    if (requiredRole && !requiredRole.includes(userRole)) {
      throw new Error('Insufficient permissions');
    }

    return {
      user,
      profile: profile || ntsUser,
      role: userRole,
      isNtsUser: !!ntsUser,
      isShipper: !!profile
    };

  } catch (error) {
    throw error;
  }
};

// 4. Secure page wrapper
export const withAuth = (WrappedComponent: any, requiredRoles?: string[]) => {
  return function AuthenticatedComponent(props: any) {
    const session = useSession();
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        if (!session) {
          router.push('/login');
          return;
        }

        try {
          await checkUserPermissions(supabase, requiredRoles);
          setAuthorized(true);
        } catch (error) {
          console.error('Authorization failed:', error);
          router.push('/unauthorized');
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [session]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!authorized) {
      return <div>Unauthorized</div>;
    }

    return <WrappedComponent {...props} />;
  };
};

// 5. Usage example:
// export default withAuth(SuperAdminDashboard, ['superadmin', 'super_admin']);
