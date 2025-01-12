import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import AddNtsUserForm from './AddNtsUserForm';
import TemplateManager from './TemplateManager';

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
    const [activeTab, setActiveTab] = useState<'analytics' | 'userManagement' | 'templateManager'>('analytics');
    const [isSessionChecked, setIsSessionChecked] = useState(false); // Add state to track session check

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
        } else {
            setIsSessionChecked(true); // Set session check as completed
        }
    }, [session, router, supabase]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const fetchNtsUsers = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('nts_users')
            .select('id, email, first_name, last_name, role, office, phone_number, extension');
        if (error) {
            setError(error.message);
        } else {
            setNtsUsers(data as NtsUser[]);
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
        if (isSessionChecked) {
            fetchNtsUsers();
            fetchCompanies();
        }
    }, [fetchNtsUsers, fetchCompanies, isSessionChecked]);

    const handleDeleteNtsUser = async (id: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Delete related records in the chat_requests table
            const { error: deleteChatRequestsError } = await supabase
                .from('chat_requests')
                .delete()
                .eq('broker_id', id);

            if (deleteChatRequestsError) {
                throw new Error(deleteChatRequestsError.message);
            }

            // Delete related records in the company_sales_users table
            const { error: deleteCompanySalesUsersError } = await supabase
                .from('company_sales_users')
                .delete()
                .eq('sales_user_id', id);

            if (deleteCompanySalesUsersError) {
                throw new Error(deleteCompanySalesUsersError.message);
            }

            // Delete the user from the nts_users table
            const { error: deleteUserError } = await supabase
                .from('nts_users')
                .delete()
                .eq('id', id);

            if (deleteUserError) {
                throw new Error(deleteUserError.message);
            }

            fetchNtsUsers();
            setSuccess('NTS User deleted successfully');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
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

        try {
            // Check if the company already has an assigned sales user
            const { data: existingAssignment, error: fetchError } = await supabase
                .from('company_sales_users')
                .select('id')
                .eq('company_id', selectedCompanyId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw new Error(fetchError.message);
            }

            if (existingAssignment) {
                // Update the existing assignment
                const { error: updateError } = await supabase
                    .from('company_sales_users')
                    .update({ sales_user_id: selectedSalesUserId })
                    .eq('id', existingAssignment.id);

                if (updateError) {
                    throw new Error(updateError.message);
                }
            } else {
                // Insert a new assignment
                const { error: insertError } = await supabase
                    .from('company_sales_users')
                    .insert({
                        company_id: selectedCompanyId,
                        sales_user_id: selectedSalesUserId,
                    });

                if (insertError) {
                    throw new Error(insertError.message);
                }
            }

            fetchCompanies();
            setSuccess('Sales user assigned successfully');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isSessionChecked) {
        return <p>Loading...</p>; // or a loading spinner
    }

    return (
        <div className="min-h-screen bg-white">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <div className="h-full">
                <div className="flex justify-center gap-1">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 border  rounded-t-lg ${activeTab === 'analytics' ? 'bg-blue-500 shadow-md text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('userManagement')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'userManagement' ? 'bg-blue-500 shadow-md text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('templateManager')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'templateManager' ? 'bg-blue-500 shadow-md text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Template Manager
                    </button>
                </div>
                {activeTab === 'analytics' && (
                    <AdminAnalytics />
                )}
                {activeTab === 'userManagement' && (
                    <div className='bg-ntsBlue/10 w-full h-screen p-4'>
                        <h2 className="text-2xl font-semibold mb-4">NTS Users</h2>
                        <div className='flex gap-2 justify-evenly'>
                            <div className="mt-2 gap-6 flex flex-col items-start justify-around">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">Add New NTS User</h3>
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
                                    <div className="mb-4">
                                        <h3 className="text-xl font-semibold mb-4">Assign Sales User to Company</h3>
                                        <label className="block text-gray-700">Select Company</label>
                                        <select
                                            value={selectedCompanyId || ''}
                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            className="w-full px-3 bg-white py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full bg-white px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="body-btn shadow-md border-none text-white transition duration-200"
                                    >
                                        Assign NTS Sales User
                                    </button>
                                </div>
                            </div>
                            <table className="w-2/3 max-h-2/3 overflow-auto bg-white rounded-lg shadow-md">
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
                                                <td key={key} className="py-1 px-4">{String(value)}</td>
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
                        </div>
                    </div>
                )}
                {activeTab === 'templateManager' && (
                    <TemplateManager />
                )}
            </div>
        </div>
    );
};

export default SuperadminDashboard;