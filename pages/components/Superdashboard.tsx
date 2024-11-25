import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';

interface SuperadminDashboardProps {
    session: Session | null;
}

type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const SuperadminDashboard: React.FC<SuperadminDashboardProps> = () => {
    const supabase = useSupabaseClient<Database>();
    const session = useSession();
    const router = useRouter();
    const [ntsUsers, setNtsUsers] = useState<NtsUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({});
    const [isNtsUserModalOpen, setIsNtsUserModalOpen] = useState(false);

    const checkSession = useCallback(() => {
        if (!session) {
            router.push('/superadmin-login');
        }
    }, [session, router]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const fetchNtsUsers = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        const { data, error } = await supabase.from('nts_users').select('*');
        if (error) {
            setError(error.message);
        } else {
            setNtsUsers(data);
        }
        setLoading(false);
    }, [session, supabase]);

    useEffect(() => {
        fetchNtsUsers();
    }, [fetchNtsUsers]);

    const handleAddNtsUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNtsUser.email || !newNtsUser.role) {
            setError('Email and role are required');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/addNtsUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newNtsUser),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            fetchNtsUsers();
            setNewNtsUser({});
            setIsNtsUserModalOpen(false);
            setSuccess('NTS User added successfully');
        } catch (error) {
            console.error('Error adding NTS User:', error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNtsUser = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('nts_users').delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchNtsUsers();
        }
        setLoading(false);
    };

    const handleEditNtsUser = async (id: string, updatedUser: Partial<NtsUser>) => {
        setLoading(true);
        const { error } = await supabase.from('nts_users').update(updatedUser).eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchNtsUsers();
        }
        setLoading(false);
    };

    if (!session) {
        return null; // or a loading spinner
    }

    const ntsUserTemplate: Partial<NtsUser> = {
        email: '',
        role: 'sales',
        first_name: '',
        last_name: '',
        phone_number: '',
        address: '',
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <AdminAnalytics />
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">NTS Users</h2>
                <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                    <thead className="bg-gray-200">
                        <tr>
                            {ntsUsers.length > 0 &&
                                Object.keys(ntsUsers[0]).map((key) => (
                                    <th key={key} className="py-2 px-4 text-left">{key}</th>
                                ))}
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ntsUsers.map((user) => (
                            <tr key={user.id} className="border-t">
                                {Object.entries(user).map(([key, value]) => (
                                    <td key={key} className="py-2 px-4">{String(value)}</td>
                                ))}
                                <td className="py-2 px-4">
                                    <button
                                        onClick={() => handleDeleteNtsUser(user.id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition duration-200 mr-2"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => handleEditNtsUser(user.id, user)}
                                        className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition duration-200"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Add New NTS User</h3>
                        <button
                            onClick={() => setIsNtsUserModalOpen(true)}
                            className="body-btn text-white transition duration-200"
                        >
                            Add NTS User
                        </button>
                        {isNtsUserModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl">
                                    <h3 className="text-xl font-semibold mb-4">Add New NTS User</h3>
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
                                            >
                                                Add NTS User
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsNtsUserModalOpen(false)}
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperadminDashboard;