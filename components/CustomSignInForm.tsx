import { useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@/lib/supabase/provider';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  team_role: string;
  inserted_at: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  profile_picture?: string | null;
  address?: string | null;
  phone_number?: string | null;
  company_id?: string | null;
  company_size?: string | null;
  email_notifications?: boolean | null;
  industry?: string | null;
}

const CustomSignInForm = () => {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (session && session.user.email_confirmed_at) {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('id, email, team_role, inserted_at')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error.message);
          return;
        }

        if (userProfile) {
          setUserProfile(userProfile as UserProfile);
          router.push('/user/logistics-management');
        } else {
          // Create a new profile if it doesn't exist
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              team_role: 'shipper',
              inserted_at: new Date().toISOString(),
            })
            .select();

          if (error) {
            console.error('Error creating/updating user profile:', error.message);
          } else {
            setUserProfile(data[0] as UserProfile);
            router.push('/user/logistics-management');
          }
        }
      }
    };

    checkUserRole();
  }, [session, router, supabase]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Restrict users with emails from ntslogistics.com or nationwidetransportservices.com
      const restrictedDomains = ['ntslogistics.com', 'nationwidetransportservices.com'];
      const emailDomain = email.split('@')[1];
      if (restrictedDomains.includes(emailDomain)) {
        setError('Users with this email domain are not allowed to sign in through this form.');
        return;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else if (authData.user) {
        // Check if user has confirmed email
        if (!authData.user.email_confirmed_at) {
          setError('Please verify your email address before signing in.');
          return;
        }

        // Check/create user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, team_role, inserted_at')
          .eq('id', authData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', profileError.message);
          setError('Error accessing user profile. Please try again.');
          return;
        }

        if (userProfile) {
          setUserProfile(userProfile as UserProfile);
          router.push('/user/logistics-management');
        } else {
          // Create a new profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              team_role: 'shipper',
              inserted_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError.message);
            setError('Error creating user profile. Please contact support.');
          } else {
            setUserProfile(newProfile as UserProfile);
            router.push('/user/logistics-management');
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSignIn} className="space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
            placeholder="your.email@company.com"
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <button 
          type="submit" 
          className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-blue-700 rounded-lg text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition-colors duration-200"
        >
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default CustomSignInForm;