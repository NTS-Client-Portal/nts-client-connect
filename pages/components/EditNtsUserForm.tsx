import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@/lib/database.types';

type NtsUser = Database['public']['Tables']['nts_users']['Row'];
type UserSupportRole = Database['public']['Tables']['user_support_roles']['Row'];

interface EditNtsUserFormProps {
    user: NtsUser;
    onClose: () => void;
    onSave: () => void;
}

const EditNtsUserForm: React.FC<EditNtsUserFormProps> = ({ user, onClose, onSave }) => {
    const [updatedUser, setUpdatedUser] = useState<Partial<NtsUser>>({});
    const [supportRoles, setSupportRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchSupportRoles = async () => {
            const { data, error } = await supabase
                .from('user_support_roles')
                .select('support_type')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching support roles:', error.message);
            } else {
                setSupportRoles(data.map((role: UserSupportRole) => role.support_type));
            }
        };

        fetchSupportRoles();
    }, [user.id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdatedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSupportRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSupportRoles((prev) =>
            checked ? [...prev, value] : prev.filter((role) => role !== value)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error: updateUserError } = await supabase
            .from('nts_users')
            .update(updatedUser)
            .eq('id', user.id);

        if (updateUserError) {
            setError(updateUserError.message);
            setLoading(false);
            return;
        }

        const { error: deleteRolesError } = await supabase
            .from('user_support_roles')
            .delete()
            .eq('user_id', user.id);

        if (deleteRolesError) {
            setError(deleteRolesError.message);
            setLoading(false);
            return;
        }

        const { error: insertRolesError } = await supabase
            .from('user_support_roles')
            .insert(
                supportRoles.map((role) => ({
                    user_id: user.id,
                    support_type: role,
                }))
            );

        if (insertRolesError) {
            setError(insertRolesError.message);
            setLoading(false);
            return;
        }

        setSuccess('NTS User updated successfully');
        setLoading(false);
        onSave();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-2xl font-semibold text-ntsBlue mb-4">Edit NTS User</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            value={updatedUser.first_name || user.first_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            value={updatedUser.last_name || user.last_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={updatedUser.email || user.email || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Phone Number</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={updatedUser.phone_number || user.phone_number || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Role</label>
                        <input
                            type="text"
                            name="role"
                            value={updatedUser.role || user.role || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Company</label>
                        <input
                            type="text"
                            name="company"
                            value={updatedUser.office || user.office || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                        />
                        </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Support Roles</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    value="tech_support"
                                    checked={supportRoles.includes('tech_support')}
                                    onChange={handleSupportRoleChange}
                                    className="mr-2"
                                />
                                Tech Support
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    value="customer_support"
                                    checked={supportRoles.includes('customer_support')}
                                    onChange={handleSupportRoleChange}
                                    className="mr-2"
                                />
                                Customer Support
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-ntsLightBlue text-white rounded-lg hover:bg-ntsBlue transition duration-200"
                        >
                            Save
                        </button>
                    </div>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                    {success && <p className="text-green-500 mt-4">{success}</p>}
                </form>
            </div>
        </div>
    );
};

export default EditNtsUserForm;