import React, { useState } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

interface AddNtsUserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ntsUsers: Database['public']['Tables']['nts_users']['Row'][];
}

type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const AddNtsUserForm: React.FC<AddNtsUserFormProps> = ({ isOpen, onClose, onSuccess, ntsUsers }) => {
    const session = useSession();
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({
        role: 'sales', // Set default role here
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

    const allowedFields = ['email', 'role', 'first_name', 'last_name', 'phone_number', 'extension', 'office'];

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

        setLoading(true);

        try {
            // Check if email already exists
            const { data: existingEmailUser, error: existingEmailError } = await supabase
                .from('nts_users')
                .select('id')
                .eq('email', newNtsUser.email)
                .single();

            if (existingEmailError && existingEmailError.code !== 'PGRST116') {
                throw new Error(existingEmailError.message);
            }

            if (existingEmailUser) {
                setError('Email already exists');
                setLoading(false);
                return;
            }

            let profilePictureUrl = null;

            if (profilePicture) {
                const { data, error: uploadError } = await supabase
                    .storage
                    .from('profile-pictures')
                    .upload(`public/${profilePicture.name}`, profilePicture);

                if (uploadError) {
                    throw new Error(uploadError.message);
                }

                const { publicUrl } = supabase.storage.from('profile-pictures').getPublicUrl(data.path).data;
                profilePictureUrl = publicUrl;
            }

            const { data: user, error: signUpError } = await supabase.auth.signUp({
                email: newNtsUser.email,
                password: uuidv4(), // Generate a random password
            });

            if (signUpError) {
                throw new Error(signUpError.message);
            }

            const companyId = process.env.NEXT_PUBLIC_NTS_COMPANYID; // Use the environment variable

            const { error: insertError } = await supabase.from('nts_users').insert({
                id: user?.user?.id,
                email: newNtsUser.email,
                role: newNtsUser.role,
                first_name: newNtsUser.first_name,
                last_name: newNtsUser.last_name,
                phone_number: newNtsUser.phone_number,
                extension: newNtsUser.extension,
                office: newNtsUser.office,
                company_id: companyId,
                profile_picture: profilePictureUrl,
                inserted_at: new Date().toISOString(),
            });

            if (insertError) {
                throw new Error(insertError.message);
            }

            const { error: signInError } = await supabase.auth.signInWithOtp({
                email: newNtsUser.email,
                options: {
                    emailRedirectTo: `https://www.shipper-connect.com/nts-set-password`,
                },
            });

            if (signInError) {
                throw new Error(signInError.message);
            }

            setNewNtsUser({ role: 'sales' });
            setProfilePicture(null);
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
                                ) : key === 'office' ? (
                                    <select
                                        value={newNtsUser[key] || ''}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, [key]: e.target.value })
                                        }
                                        className="w-full px-3 bg-white py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Office</option>
                                        <option value="Florence, KY">Florence, KY</option>
                                        <option value="Fort Lauderdale, FL">Fort Lauderdale, FL</option>
                                        <option value="Fort Myers, FL">Fort Myers, FL</option>
                                        <option value="Fort Pierce, FL">Fort Pierce, FL</option>
                                        <option value="Doral, FL">Doral, FL</option>
                                        <option value="Orlando, FL">Orlando, FL</option>
                                        <option value="Tampa, FL">Tampa, FL</option>
                                        <option value="West Palm Beach, FL">West Palm Beach, FL</option>
                                        <option value="Jacksonville, FL">Jacksonville, FL</option>
                                        <option value="Cleveland, Ohio">Cleveland, Ohio</option>
                                    </select>
                                ) : key === 'phone_number' ? (
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={newNtsUser[key] || ''}
                                            onChange={(e) =>
                                                setNewNtsUser({ ...newNtsUser, [key]: e.target.value })
                                            }
                                            className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Ext"
                                            value={newNtsUser.extension || ''}
                                            onChange={(e) =>
                                                setNewNtsUser({ ...newNtsUser, extension: e.target.value })
                                            }
                                            className="w-1/4 bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                                        />
                                    </div>
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
                            <label className="block text-gray-700">Profile Picture</label>
                            <input
                                type="file"
                                onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
                                className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {profilePicture && (
                                <Image
                                    src={URL.createObjectURL(profilePicture)}
                                    alt="Profile Preview"
                                    width={128}
                                    height={128}
                                    className="mt-2 object-cover rounded-full"
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