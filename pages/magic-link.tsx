import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';

const MagicLink = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const handleMagicLink = async () => {
            const { error } = await supabase.auth.verifyOtp({
                email: router.query.email as string,
                token: router.query.token as string,
                type: 'magiclink',
            });

            if (error) {
                setError(error.message);
            } else {
                setLoading(false);
            }
        };

        if (router.query.email && router.query.token) {
            handleMagicLink();
        }
    }, [router.query.email, router.query.token]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            router.push('/login');
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Set Your Password</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={handleSetPassword}>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    className="body-btn text-white transition duration-200"
                >
                    Set Password
                </button>
            </form>
        </div>
    );
};

export default MagicLink;