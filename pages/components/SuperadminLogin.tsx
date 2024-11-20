import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const SuperadminLogin = () => {
    const supabase = useSupabaseClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setLoading(false);
            setError('Invalid email or password');
            return;
        }

        // Check if the user has the superadmin role
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        setLoading(false);

        if (profileError || userProfile.role !== 'superadmin') {
            setError('You do not have permission to access this page');
            await supabase.auth.signOut();
        } else {
            router.push('/superdash');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Superadmin Login</h1>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Email"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SuperadminLogin;