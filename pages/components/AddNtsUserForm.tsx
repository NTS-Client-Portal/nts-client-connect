import React, { useState } from 'react';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { v4 as uuidv4 } from 'uuid';

interface AddNtsUserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ntsUsers: Database['public']['Tables']['nts_users']['Row'][];
}

type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const AddNtsUserForm: React.FC<AddNtsUserFormProps> = ({ isOpen, onClose, onSuccess, ntsUsers }) => {
    const supabase = useSupabaseClient<Database>();
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddNtsUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newNtsUser.email || !newNtsUser.role || !newNtsUser.first_name || !newNtsUser.last_name) {
            setError('Email, role, first name, and last name are required');
            return;
        }

        setLoading(true);

        try {
            // Generate a random UUID for the id field
            const userId = uuidv4();

            // Insert the user into the nts_users table with the specified company_id
            const { error: insertError } = await supabase.from('nts_users').insert({
                email: newNtsUser.email,
                role: newNtsUser.role,
                first_name: newNtsUser.first_name,
                last_name: newNtsUser.last_name,
                phone_number: newNtsUser.phone_number,
                address: newNtsUser.address,
                id: userId,
                company_id: 'cc0e2fd6-e5b5-4a7e-b375-7c0d28e2b45d', // Set the company_id field
                inserted_at: new Date().toISOString(), // Set the inserted_at field
            });

            if (insertError) {
                throw new Error(insertError.message);
            }

            setNewNtsUser({});
            onClose();
            onSuccess();
        } catch (error) {
            console.error('Error adding NTS User:', error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const ntsUserTemplate: Partial<NtsUser> = {
        email: '',
        role: 'sales',
        first_name: '',
        last_name: '',
        phone_number: '',
        address: '',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl">
                <h3 className="text-xl font-semibold mb-4">Add New NTS User</h3>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={handleAddNtsUser}>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(ntsUsers[0] || ntsUserTemplate).map((key) => (
                            key !== 'id' && key !== 'profile_picture' && key !== 'email_notifications' && key !== 'profile_id' && key !== 'company_id' && (
                                <div key={key} className="mb-4">
                                    <label className="block text-gray-700">{key}</label>
                                    {key === 'role' ? (
                                        <select
                                            value={newNtsUser[key] || ''}
                                            onChange={(e) =>
                                                setNewNtsUser({ ...newNtsUser, [key]: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select a role</option>
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
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                </div>
                            )
                        ))}
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