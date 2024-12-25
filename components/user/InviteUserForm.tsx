import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { v4 as uuidv4 } from 'uuid';

interface InviteUserFormProps {
    companyId: string;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ companyId }) => {
    const supabase = useSupabaseClient<Database>();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (password: string): boolean => {
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        return hasLowercase && hasUppercase && hasDigit;
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must contain at least one lowercase letter, one uppercase letter, and one digit');
            setLoading(false);
            return;
        }

        try {
            // Sign up the user in the auth.users table
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw new Error(error.message);
            }

            // Insert the profile into the profiles table
            const profileId = uuidv4(); // Generate a unique ID for the profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: profileId, // Use the generated UUID
                    email: email, // Use the email fetched from auth.users
                    phone_number: phoneNumber, // Include phone number
                    company_id: companyId,
                    profile_complete: true, // Set profile_complete to true
                    team_role: 'member', // Set team_role to member
                });

            if (profileError) {
                throw new Error(profileError.message);
            }

            console.log('Profile created successfully');
            setSuccess(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <h2 className="text-2xl font-bold mb-4"></h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success ? (
                <div className="text-green-500 mb-4">User invited successfully!</div>
            ) : (
                <form onSubmit={handleInviteUser} className="w-full max-w-md">
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
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Temporary Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Temporary Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full body-btn"
                        disabled={loading}
                    >
                        {loading ? 'Inviting...' : 'Invite User'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default InviteUserForm;