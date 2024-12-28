import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
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

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setError(error.message);
            } else {
                router.push('/user/logistics-management');
            }
        } catch (error) {
            setError('An unexpected error occurred. Please try again.');
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
                    className="absolute inset-y-0 top-1/3 right-0 pr-3 flex items-center text-sm leading-5"
                >
                    {showPassword ? <EyeOff className="h-5 w-5 text-zinc-900" /> : <Eye className="h-5 w-5 text-zinc-900" />}
                </button>
            </div>
            <button type="submit" className="flex justify-center w-full">
                <span className='body-btn text-center w-full'>Sign In</span>
            </button>
        </form>
    );
};

export default CustomSignInForm;