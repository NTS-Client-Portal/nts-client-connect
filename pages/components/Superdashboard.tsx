import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import AddNtsUserForm from './AddNtsUserForm';
import TemplateManager from './TemplateManager';
import EditNtsUserForm from './EditNtsUserForm';
import ShipperUserManagement from './ShipperUserManagement';

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
    const [activeTab, setActiveTab] = useState<'analytics' | 'shipperUserManagement' | 'templateManager' | 'userManagement' >('userManagement');
    const [isSessionChecked, setIsSessionChecked] = useState(false);
    const [selectedUser, setSelectedUser] = useState<NtsUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<NtsUser | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');

    const checkSession = useCallback(async () => {
        if (!session) {
            router.push('/superadmin-login');
            return;
        }

        const { data: userProfile, error: profileError } = await supabase
            .from('nts_users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profileError || userProfile?.role !== 'superadmin') {
            router.push('/superadmin-login');
        } else {
            setIsSessionChecked(true);
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
            .select('email, first_name, last_name, role, office, phone_number, extension');
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
            const { error: deleteChatRequestsError } = await supabase
                .from('chat_requests')
                .delete()
                .eq('broker_id', id);

            if (deleteChatRequestsError) {
                throw new Error(deleteChatRequestsError.message);
            }

            const { error: deleteCompanySalesUsersError } = await supabase
                .from('company_sales_users')
                .delete()
                .eq('sales_user_id', id);

            if (deleteCompanySalesUsersError) {
                throw new Error(deleteCompanySalesUsersError.message);
            }

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
            setUserToDelete(null);
            setDeleteConfirmation('');
        }
    };

    const handleEditNtsUser = (user: NtsUser) => {
        setSelectedUser(user);
    };

    const handleCloseEditForm = () => {
        setSelectedUser(null);
    };

    const handleSaveEditForm = () => {
        fetchNtsUsers();
        setSelectedUser(null);
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
            const { data: existingAssignment, error: fetchError } = await supabase
                .from('company_sales_users')
                .select('id')
                .eq('company_id', selectedCompanyId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw new Error(fetchError.message);
            }

            if (existingAssignment) {
                const { error: updateError } = await supabase
                    .from('company_sales_users')
                    .update({ sales_user_id: selectedSalesUserId })
                    .eq('id', existingAssignment.id);

                if (updateError) {
                    throw new Error(updateError.message);
                }
            } else {
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
        return <p>Loading...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <div className="h-full">
                <div className="flex justify-center gap-1">
                    <button
                        onClick={() => setActiveTab('userManagement')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'userManagement' ? 'bg-blue-500 shadow-md text-white' : 'bg-gray-300 text-zinc-700'}`}
                    >
                        NTS User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('shipperUserManagement')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'shipperUserManagement' ? 'bg-blue-500 shadow-md text-white' : 'bg-zinc-300 text-zinc-700'}`}
                    > 
                        Shipper User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('templateManager')}
                        className={`px-4 py-2 rounded-t-lg ${activeTab === 'templateManager' ? 'bg-blue-500 shadow-md text-white' : 'bg-zinc-300 text-zinc-700'}`}
                    >
                        Template Manager
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 border  rounded-t-lg ${activeTab === 'analytics' ? 'bg-blue-500 shadow-md text-white' : 'bg-zinc-300 text-zinc-700'}`}
                    >
                        Analytics
                    </button>
                </div>

                {activeTab === 'userManagement' && (
                    <div className='bg-zinc-50 w-full h-screen p-4'>
                        <h2 className="text-2xl font-semibold mb-4 text-center">NTS Users</h2>
                        <div className='flex flex-col items-center gap-2 justify-evenly'>
                                <div className='flex items-start justify-start w-full'>
                                    <div className='flex flex-col items-center w-1/2'>
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
                                </div>
                            
                            <table className="w-2/3 max-h-2/3 overflow-auto rounded-lg shadow-md">
                                <thead className=" bg-ntsBlue text-white">
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
                                            <td className="py-2 px-4 flex flex-col justify-center gap-2">
                                            <button
                                                    onClick={() => handleEditNtsUser(user)}
                                                    className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition duration-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setUserToDelete(user)}
                                                    className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition duration-200"
                                                >
                                                    Delete
                                                </button>

                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'shipperUserManagement' && (
                    <ShipperUserManagement />
                )}
                {activeTab === 'templateManager' && (
                    <TemplateManager />
                )}
            </div>
            {selectedUser && (
                <EditNtsUserForm
                    user={selectedUser}
                    onClose={handleCloseEditForm}
                    onSave={handleSaveEditForm}
                />
            )}
            {userToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                        <h2 className="text-2xl font-semibold text-ntsBlue mb-4">Confirm Deletion</h2>
                        <p className="mb-4">
                            Are you sure you want to delete the user with email{' '}
                            <strong>{userToDelete.email}</strong>? Please type the email address to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue mb-4"
                        />
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteNtsUser(userToDelete.id)}
                                disabled={deleteConfirmation !== userToDelete.email}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'analytics' && (
                    <AdminAnalytics />
                )}
        </div>
    );
};

export default SuperadminDashboard;