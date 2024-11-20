import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import { v4 as uuidv4 } from 'uuid';

type Profile = Database['public']['Tables']['profiles']['Row'];

const SuperadminDashboard = () => {
    const supabase = useSupabaseClient<Database>();
    const session = useSession();
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newNtsUser, setNewNtsUser] = useState<Partial<Profile>>({});
    const [newCompanyUser, setNewCompanyUser] = useState<Partial<Profile>>({});
    const [isNtsUserModalOpen, setIsNtsUserModalOpen] = useState(false);
    const [isCompanyUserModalOpen, setIsCompanyUserModalOpen] = useState(false);

    const checkSession = useCallback(() => {
        if (!session) {
            router.push('/superadmin-login');
        }
    }, [session, router]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const fetchProfiles = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            setError(error.message);
        } else {
            setProfiles(data);
        }
        setLoading(false);
    }, [session, supabase]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleDelete = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
        }
        setLoading(false);
    };

    const handleAddNtsUser = async () => {
        setLoading(true);
        const { error } = await supabase.from('profiles').insert([{ ...newNtsUser, id: uuidv4() }]);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
            setNewNtsUser({});
            setIsNtsUserModalOpen(false);
        }
        setLoading(false);
    };

    const handleAddCompanyUser = async () => {
        setLoading(true);
        const { error } = await supabase.from('profiles').insert([{ ...newCompanyUser, id: uuidv4(), company_id: uuidv4() }]);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
            setNewCompanyUser({});
            setIsCompanyUserModalOpen(false);
        }
        setLoading(false);
    };

    const handleEditProfile = async (id: string, updatedProfile: Partial<Profile>) => {
        setLoading(true);
        const { error } = await supabase.from('profiles').update(updatedProfile).eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
        }
        setLoading(false);
    };

    if (!session) {
        return null; // or a loading spinner
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <AdminAnalytics />
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Profiles</h2>
                <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                    <thead className="bg-gray-200">
                        <tr>
                            {profiles.length > 0 &&
                                Object.keys(profiles[0]).map((key) => (
                                    <th key={key} className="py-2 px-4 text-left">{key}</th>
                                ))}
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((profile) => (
                            <tr key={profile.id} className="border-t">
                                {Object.entries(profile).map(([key, value]) => (
                                    <td key={key} className="py-2 px-4">{String(value)}</td>
                                ))}
                                <td className="py-2 px-4">
                                    <button
                                        onClick={() => handleDelete(profile.id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition duration-200 mr-2"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => handleEditProfile(profile.id, profile)}
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
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                        >
                            Add NTS User
                        </button>
                        {isNtsUserModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg">
                                    <h3 className="text-xl font-semibold mb-4">Add New NTS User</h3>
                                    {Object.keys(profiles[0]).map((key) => (
                                        key !== 'id' && key !== 'company_id' && key !== 'inserted_at' && key !== 'profile_complete' && (
                                            <div key={key} className="mb-4">
                                                <label className="block text-gray-700">{key}</label>
                                                <input
                                                    type="text"
                                                    value={newNtsUser[key] || ''}
                                                    onChange={(e) =>
                                                        setNewNtsUser({ ...newNtsUser, [key]: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )
                                    ))}
                                    <button
                                        onClick={handleAddNtsUser}
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                                    >
                                        Add NTS User
                                    </button>
                                    <button
                                        onClick={() => setIsNtsUserModalOpen(false)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Add New Company User</h3>
                        <button
                            onClick={() => setIsCompanyUserModalOpen(true)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                        >
                            Add Company User
                        </button>
                        {isCompanyUserModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg">
                                    <h3 className="text-xl font-semibold mb-4">Add New Company User</h3>
                                    {Object.keys(profiles[0]).map((key) => (
                                        key !== 'id' && key !== 'company_id' && key !== 'inserted_at' && key !== 'profile_complete' && (
                                            <div key={key} className="mb-4">
                                                <label className="block text-gray-700">{key}</label>
                                                <input
                                                    type="text"
                                                    value={newCompanyUser[key] || ''}
                                                    onChange={(e) =>
                                                        setNewCompanyUser({ ...newCompanyUser, [key]: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )
                                    ))}
                                    <button
                                        onClick={handleAddCompanyUser}
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                                    >
                                        Add Company User
                                    </button>
                                    <button
                                        onClick={() => setIsCompanyUserModalOpen(false)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                                    >
                                        Cancel
                                    </button>
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