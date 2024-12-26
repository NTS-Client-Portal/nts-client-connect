import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { assignSalesUser } from '@/lib/assignSalesUser'; // Import the assignSalesUser function
import { Eye, EyeOff } from 'lucide-react';

const CustomSignInForm = () => {
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

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

            // Check if the user exists in the nts_users table
            const { data: internalUser, error: internalUserError } = await supabase
                .from('nts_users')
                .select('id')
                .eq('email', email)
                .single();

            if (internalUserError && internalUserError.code !== 'PGRST116') {
                throw new Error(internalUserError.message);
            }

            if (internalUser) {
                setError('Internal users are not allowed to sign in to the client version of the application.');
                return;
            }

            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

            if (signInError) {
                setError(signInError.message);
                return;
            }

            // Check if the user has an assigned sales user
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('company_id, assigned_sales_user')
                .eq('email', email)
                .single();

            if (profileError) {
                throw new Error(profileError.message);
            }

            if (profile && !profile.assigned_sales_user) {
                // Assign a sales user if not already assigned
                await assignSalesUser(profile.company_id);
            }

            setError(null);
            // Redirect to /user/index.tsx
            router.push('/user');
        } catch (error) {
            setError(error.message);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <form onSubmit={handleSignIn}>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 p-2 border border-zinc-300 rounded w-full"
                    required
                />
            </div>
            <div className="mb-4 relative">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                    Password
                </label>
                <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 p-2 border border-zinc-300 rounded w-full"
                    required
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                </button>
            </div>
            <button type="submit" className="flex justify-center w-full">
                <span className='body-btn text-center w-full'>Sign In</span>
            </button>
        </form>
    );
};

export default CustomSignInForm;