import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import { v4 as uuidv4 } from 'uuid';

interface SuperadminDashboardProps {
    session: Session | null;
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type NtsUser = Database['public']['Tables']['nts_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

const SuperadminDashboard: React.FC<SuperadminDashboardProps> = () => {
    const supabase = useSupabaseClient<Database>();
    const session = useSession();
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [ntsUsers, setNtsUsers] = useState<NtsUser[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({});
    const [isNtsUserModalOpen, setIsNtsUserModalOpen] = useState(false);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const generateProfileId = async () => {
        const { data, error } = await supabase
            .from('nts_users')
            .select('profile_id')
            .order('profile_id', { ascending: false })
            .limit(1);

        if (error) {
            setError(error.message);
            return null;
        }

        const latestProfileId = data.length > 0 ? data[0].profile_id : 'N0000';
        const newProfileIdNumber = parseInt(latestProfileId.slice(1)) + 1;
        return `N${newProfileIdNumber.toString().padStart(4, '0')}`;
    };

    const checkUserExists = async (email: string) => {
        const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
        const { data, error } = await serviceSupabase.auth.admin.listUsers();
        if (error) {
            throw new Error(error.message);
        }
        const users = data.users as { email: string }[]; // Ensure users are correctly typed
        return users.some(user => user.email === email);
    };

    const handleAddNtsUser = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted');
        if (!newNtsUser.email || !newNtsUser.role) {
            setError('Email and role are required');
            return;
        }

        setLoading(true);

        try {
            console.log('Checking if user exists');
            // Check if the user already exists in auth.users
            const userExists = await checkUserExists(newNtsUser.email as string);
            let userId;
            let newProfileId;

            if (!userExists) {
                console.log('User does not exist, creating new user');
                // Step 1: Generate a new profile_id
                newProfileId = await generateProfileId();
                if (!newProfileId) {
                    throw new Error('Failed to generate profile_id');
                }

                // Step 2: Sign up the user in auth.users using the service role key
                const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
                const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
                    email: newNtsUser.email as string,
                    password: 'NtsBlue123!', // You can generate a random password or handle it differently
                    email_confirm: true,
                });

                if (authError) {
                    throw new Error(authError.message);
                }

                userId = authUser.user.id;
            } else {
                console.log('User exists, fetching user ID');
                // Fetch the user ID from auth.users
                const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
                const { data: usersData, error: usersError } = await serviceSupabase.auth.admin.listUsers();
                if (usersError) {
                    throw new Error(usersError.message);
                }
                const existingUser = usersData.users.find((user: { email: string }) => user.email === newNtsUser.email);
                userId = existingUser?.id;

                // Generate a new profile_id for existing users
                newProfileId = await generateProfileId();
                if (!newProfileId) {
                    throw new Error('Failed to generate profile_id');
                }
            }

            console.log('Inserting into profiles table');
            // Step 3: Insert into profiles table
            const profileToInsert: Profile = {
                id: userId,
                email: newNtsUser.email as string,
                first_name: newNtsUser.first_name || null,
                last_name: newNtsUser.last_name || null,
                phone_number: newNtsUser.phone_number || null,
                company_id: uuidv4(), // Assign a random company_id
                profile_picture: null,
                address: newNtsUser.address || null,
                email_notifications: null,
                team_role: null,
                assigned_sales_user: null,
                company_name: null,
                company_size: null,
                profile_complete: true,
                inserted_at: new Date().toISOString(), // Set inserted_at to the current date and time
            };

            const { error: profileError } = await supabase.from('profiles').insert([profileToInsert]);
            if (profileError) {
                throw new Error(profileError.message);
            }

            console.log('Inserting into nts_users table');
            // Step 4: Insert into nts_users table
            const ntsUserToInsert: NtsUser = {
                id: userId,
                profile_id: newProfileId,
                company_id: uuidv4(), // Assign a random company_id
                email: newNtsUser.email as string,
                role: newNtsUser.role as string,
                first_name: newNtsUser.first_name || null,
                last_name: newNtsUser.last_name || null,
                phone_number: newNtsUser.phone_number || null,
                profile_picture: null,
                address: newNtsUser.address || null,
                email_notifications: false,
                inserted_at: new Date().toISOString(), // Set inserted_at to the current date and time
            };

            const { error: ntsUserError } = await supabase.from('nts_users').insert([ntsUserToInsert]);
            if (ntsUserError) {
                throw new Error(ntsUserError.message);
            }

            console.log('NTS User added successfully');
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
        address: '',
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
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
                                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
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