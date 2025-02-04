import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const NtsSetPassword = () => {
    const router = useRouter();
    const session = useSession();
    const supabase = useSupabaseClient();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const { email, token } = router.query;
        if (email && token) {
            supabase.auth.verifyOtp({
                email: email as string,
                token: token as string,
                type: 'signup',
            }).then(({ error }) => {
                if (error) {
                    setError(error.message);
                }
            });
        }
    }, [router.query, supabase]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!session) {
            setError('Auth session missing!');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            router.push('/nts/login/');
        }

        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">Set Your Password</h1>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={handleSetPassword}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={loading}
                    >
                        {loading ? 'Setting Password...' : 'Set Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NtsSetPassword;