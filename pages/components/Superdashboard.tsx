import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import { v4 as uuidv4 } from 'uuid';

type Profile = Database['public']['Tables']['profiles']['Row'];
type NtsUser = Database['public']['Tables']['nts_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

const SuperadminDashboard = () => {
    const supabase = useSupabaseClient<Database>();
    const session = useSession();
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [ntsUsers, setNtsUsers] = useState<NtsUser[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({});
    const [newProfile, setNewProfile] = useState<Partial<Profile>>({});
    const [isNtsUserModalOpen, setIsNtsUserModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

    const fetchCompanies = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        const { data, error } = await supabase.from('companies').select('*');
        if (error) {
            setError(error.message);
        } else {
            setCompanies(data);
        }
        setLoading(false);
    }, [session, supabase]);

    useEffect(() => {
        fetchProfiles();
        fetchNtsUsers();
        fetchCompanies();
    }, [fetchProfiles, fetchNtsUsers, fetchCompanies]);

    const handleDeleteProfile = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
        }
        setLoading(false);
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

    const handleAddNtsUser = async () => {
        if (!newNtsUser.email || !newNtsUser.role) {
            setError('Email and role are required');
            return;
        }

        const ntsUserToInsert: NtsUser = {
            id: uuidv4(),
            profile_id: newNtsUser.profile_id,
            company_id: newNtsUser.company_id,
            email: newNtsUser.email,
            role: newNtsUser.role,
            first_name: newNtsUser.first_name || null,
            last_name: newNtsUser.last_name || null,
            phone_number: newNtsUser.phone_number || null,
            profile_picture: newNtsUser.profile_picture || null,
            address: newNtsUser.address || null,
            inserted_at: new Date().toISOString(),
            email_notifications: newNtsUser.email_notifications || false,
        };

        setLoading(true);
        const { error } = await supabase.from('nts_users').insert([ntsUserToInsert]);
        if (error) {
            setError(error.message);
        } else {
            fetchNtsUsers();
            setNewNtsUser({});
            setIsNtsUserModalOpen(false);
        }
        setLoading(false);
    };

    const handleAddProfile = async () => {
        if (!newProfile.email || !newProfile.team_role) {
            setError('Email and role are required');
            return;
        }

        const profileToInsert: Profile = {
            id: uuidv4(),
            email: newProfile.email,
            first_name: newProfile.first_name || null,
            last_name: newProfile.last_name || null,
            phone_number: newProfile.phone_number || null,
            company_id: newProfile.company_id || null,
            profile_picture: newProfile.profile_picture || null,
            address: newProfile.address || null,
            inserted_at: new Date().toISOString(),
            email_notifications: newProfile.email_notifications || null,
            team_role: newProfile.team_role || null,
            assigned_sales_user: newProfile.assigned_sales_user || null,
            company_name: newProfile.company_name || null,
            company_size: newProfile.company_size || null,
            profile_complete: newProfile.profile_complete || false,
        };

        setLoading(true);
        const { error } = await supabase.from('profiles').insert([profileToInsert]);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
            setNewProfile({});
            setIsProfileModalOpen(false);
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
        profile_picture: '',
        address: '',
        inserted_at: '',
        email_notifications: false,
        profile_id: '',
        company_id: ''
    };

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
                                        onClick={() => handleDeleteProfile(profile.id)}
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
                        <h3 className="text-xl font-semibold mb-4">Add New Profile</h3>
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                        >
                            Add Profile
                        </button>
                        {isProfileModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl">
                                    <h3 className="text-xl font-semibold mb-4">Add New Profile</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.keys(profiles[0] || {}).map((key) => (
                                            key !== 'id' && key !== 'company_id' && key !== 'inserted_at' && key !== 'profile_complete' && (
                                                <div key={key} className="mb-4">
                                                    <label className="block text-gray-700">{key}</label>
                                                    <input
                                                        type="text"
                                                        value={newProfile[key] || ''}
                                                        onChange={(e) =>
                                                            setNewProfile({ ...newProfile, [key]: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleAddProfile}
                                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                                        >
                                            Add Profile
                                        </button>
                                        <button
                                            onClick={() => setIsProfileModalOpen(false)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
                                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl">
                                    <h3 className="text-xl font-semibold mb-4">Add New NTS User</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.keys(ntsUsers[0] || ntsUserTemplate).map((key) => (
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
                                        <div className="mb-4">
                                            <label className="block text-gray-700">Assigned Company</label>
                                            <select
                                                value={newNtsUser.company_id || ''}
                                                onChange={(e) =>
                                                    setNewNtsUser({ ...newNtsUser, company_id: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select a company</option>
                                                {companies.map((company) => (
                                                    <option key={company.id} value={company.id}>
                                                        {company.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperadminDashboard;