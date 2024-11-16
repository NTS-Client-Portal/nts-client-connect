import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';

const CustomSignUpForm = () => {
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            setError(null);

            // Check if the user is the first in the company
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', 'your_company_id'); // Replace with actual company_id logic

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError.message);
            } else {
                const teamRole = profiles.length === 0 ? 'manager' : 'member';

                // Insert the new profile with the appropriate team_role
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: signUpData.user.id,
                        email: signUpData.user.email,
                        team_role: teamRole,
                        inserted_at: new Date().toISOString(),
                    });

                if (insertError) {
                    console.error('Error creating/updating user profile:', insertError.message);
                } else {
                    router.push('/profile-setup');
                }
            }
        }
    };

    return (
        <form onSubmit={handleSignUp}>
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
            <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 p-2 border border-zinc-300 rounded w-full"
                    required
                />
            </div>
            <button type="submit" className="flex justify-center w-full">
                <span className='body-btn text-center w-full'>Sign Up</span>
            </button>
        </form>
    );
};

export default CustomSignUpForm;