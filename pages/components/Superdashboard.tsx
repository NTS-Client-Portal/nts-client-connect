import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import AddNtsUserForm from './AddNtsUserForm';

interface SuperadminDashboardProps {
    session: Session | null;
}

type NtsUser = Database['public']['Tables']['nts_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

const SuperadminDashboard: React.FC<SuperadminDashboardProps> = () => {
    const supabase = useSupabaseClient<Database>();
    const session = useSession();
    const router = useRouter();
    const [ntsUsers, setNtsUsers] = useState<NtsUser[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isNtsUserModalOpen, setIsNtsUserModalOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedSalesUserId, setSelectedSalesUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'analytics' | 'userManagement'>('analytics');

    const checkSession = useCallback(async () => {
        if (!session) {
            router.push('/superadmin-login');
            return;
        }

        // Check if the user has the superadmin role
        const { data: userProfile, error: profileError } = await supabase
            .from('nts_users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profileError || userProfile?.role !== 'superadmin') {
            router.push('/superadmin-login');
        }
    }, [session, router, supabase]);

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
        fetchNtsUsers();
        fetchCompanies();
    }, [fetchNtsUsers, fetchCompanies]);

    const handleDeleteNtsUser = async (id: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase.from('nts_users').delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchNtsUsers();
            setSuccess('NTS User deleted successfully');
        }
        setLoading(false);
    };

    const handleEditNtsUser = async (id: string, updatedUser: Partial<NtsUser>) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase.from('nts_users').update(updatedUser).eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchNtsUsers();
            setSuccess('NTS User updated successfully');
        }
        setLoading(false);
    };

    const handleAssignSalesUser = async () => {
        if (!selectedCompanyId || !selectedSalesUserId) {
            setError('Please select a company and a sales user');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase
            .from('company_sales_users')
            .insert({ company_id: selectedCompanyId, sales_user_id: selectedSalesUserId });

        if (error) {
            setError(error.message);
        } else {
            fetchCompanies();
            setSuccess('Sales user assigned successfully');
        }
        setLoading(false);
    };

    if (!session) {
        return <p>Loading...</p>; // or a loading spinner
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <div className="mb-6">
                <div className="flex justify-center mb-4">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'analytics' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('userManagement')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'userManagement' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        User Management
                    </button>
                </div>
                {activeTab === 'analytics' && (
                    <AdminAnalytics />
                )}
                {activeTab === 'userManagement' && (
                    <div>
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
                                <AddNtsUserForm
                                    isOpen={isNtsUserModalOpen}
                                    onClose={() => setIsNtsUserModalOpen(false)}
                                    onSuccess={() => {
                                        setSuccess('NTS User added successfully');
                                        fetchNtsUsers();
                                    }}
                                    ntsUsers={ntsUsers}
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Assign Sales User to Company</h3>
                                <div className="mb-4">
                                    <label className="block text-gray-700">Select Company</label>
                                    <select
                                        value={selectedCompanyId || ''}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
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
                                <div className="mb-4">
                                    <label className="block text-gray-700">Select Sales User</label>
                                    <select
                                        value={selectedSalesUserId || ''}
                                        onChange={(e) => setSelectedSalesUserId(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a sales user</option>
                                        {ntsUsers
                                            .filter((user) => user.role === 'sales')
                                            .map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleAssignSalesUser}
                                    className="body-btn text-white transition duration-200"
                                >
                                    Assign NTS Sales User
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperadminDashboard;