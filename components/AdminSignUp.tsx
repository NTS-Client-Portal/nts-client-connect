import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';

const AdminSignUp = () => {
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Restrict access based on email domain
        const allowedDomain = 'ntslogistics.com';
        const emailDomain = email.split('@')[1];
        if (emailDomain !== allowedDomain) {
            setError('You are not authorized to sign up as an admin.');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw new Error(error.message);
            }

            const userId = data.user?.id;
            if (!userId) {
                throw new Error('User ID not found in response');
            }

            // Insert the user's profile into the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    role: 'admin',
                });

            if (profileError) {
                throw new Error(profileError.message);
            }

            setSuccess(true);
            router.push('/admin/dashboard');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Admin Sign Up</h1>
            {error && <div>{error}</div>}
            {success ? (
                <div>Sign up successful! Redirecting...</div>
            ) : (
                <form onSubmit={handleSignUp}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AdminSignUp;