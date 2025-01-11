import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';
import { Eye, EyeOff } from 'lucide-react';

const SuperadminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setLoading(false);
            setError('Invalid email or password');
            return;
        }

        const { data: userProfile, error: profileError } = await supabase
            .from('nts_users')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        setLoading(false);

        if (profileError || userProfile?.role !== 'superadmin') {
            setError('You do not have permission to access this page');
            return;
        }

        // Redirect to the superadmin dashboard
        router.push('/superdash');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-2xl font-bold mb-4">Superadmin Login</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleLogin} className="w-full max-w-sm">
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full p-1 rounded-md border border-gray-300 shadow-md focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50"
                    />
                </div>
                <div className="mb-4 relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full py-1 rounded-md border border-gray-300 shadow-sm focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50"
                    />
                    <div
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ntsLightBlue hover:bg-ntsLightBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ntsLightBlue"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default SuperadminLogin;