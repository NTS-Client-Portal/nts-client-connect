import React, { useState } from 'react';
import { Database } from '@/lib/database.types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AddNtsUserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ntsUsers: Database['public']['Tables']['nts_users']['Row'][];
}

type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const AddNtsUserForm: React.FC<AddNtsUserFormProps> = ({ isOpen, onClose, onSuccess, ntsUsers }) => {
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({
        role: 'sales', // Set default role here
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyId, setCompanyId] = useState(''); // Add companyId state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

    const allowedFields = ['email', 'role', 'first_name', 'last_name', 'phone_number', 'office'];

    const handleAddNtsUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newNtsUser.email) {
            setError('Email is required');
            return;
        }
        if (!newNtsUser.role) {
            setError('Role is required');
            return;
        }
        if (!newNtsUser.first_name) {
            setError('First name is required');
            return;
        }
        if (!newNtsUser.last_name) {
            setError('Last name is required');
            return;
        }
        if (!password) {
            setError('Password is required');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!companyId) {
            setError('Company ID is required');
            return;
        }

        setLoading(true);

        try {
            let profilePictureUrl = null;

            if (profilePicture) {
                const { data, error: uploadError } = await supabase
                    .storage
                    .from('profile-pictures')
                    .upload(`public/${profilePicture.name}`, profilePicture);

                if (uploadError) {
                    throw new Error(uploadError.message);
                }

                profilePictureUrl = `${supabaseUrl}/storage/v1/object/public/profile-pictures/${data.path}`;
            }

            const { error: insertError } = await supabase.from('nts_users').insert({
                email: newNtsUser.email,
                role: newNtsUser.role,
                first_name: newNtsUser.first_name,
                last_name: newNtsUser.last_name,
                phone_number: newNtsUser.phone_number,
                office: newNtsUser.office,
                company_id: companyId,
                profile_picture: profilePictureUrl,
                inserted_at: new Date().toISOString(),
            });

            if (insertError) {
                throw new Error(insertError.message);
            }

            setNewNtsUser({ role: 'sales' }); // Reset form with default role
            setPassword('');
            setConfirmPassword('');
            setProfilePicture(null);
            setCompanyId(''); // Reset companyId
            onClose();
            onSuccess();
        } catch (error) {
            console.error('Error adding NTS User:', error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl">
                <h3 className="text-xl font-semibold mb-4">Add New NTS User</h3>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={handleAddNtsUser}>
                    <div className="grid grid-cols-2 gap-4">
                        {allowedFields.map((key) => (
                            <div key={key} className="mb-4">
                                <label className="block text-gray-700">{key}</label>
                                {key === 'role' ? (
                                    <select
                                        value={newNtsUser[key] || 'sales'}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, [key]: e.target.value })
                                        }
                                        className="w-full px-3 bg-white py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="sales">Sales</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Superadmin</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={newNtsUser[key] || ''}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, [key]: e.target.value })
                                        }
                                        className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        ))}
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
                        <div className="mb-4">
                            <label className="block text-gray-700">Company ID</label>
                            <input
                                type="text"
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Profile Picture</label>
                            <input
                                type="file"
                                onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
                                className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {profilePicture && (
                                <img
                                    src={URL.createObjectURL(profilePicture)}
                                    alt="Profile Preview"
                                    className="mt-2 w-32 h-32 object-cover rounded-full"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            className="body-btn text-white transition duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add NTS User'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNtsUserForm;