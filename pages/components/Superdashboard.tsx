import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';
import AddNtsUserForm from './AddNtsUserForm';
import TemplateManager from './TemplateManager';
import EditNtsUserForm from './EditNtsUserForm';
import ShipperUserManagement from './ShipperUserManagement';
import { 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield,
  Crown,
  AlertCircle,
  CheckCircle2,
  LogOut
} from 'lucide-react';

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

        // Check for both legacy and new super admin role formats
        const validSuperAdminRoles = ['superadmin', 'super_admin'];
        if (profileError || !userProfile?.role || !validSuperAdminRoles.includes(userProfile.role)) {
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

    const handleLogout = async () => {
        try {
            // Sign out from Supabase (this clears auth cookies/tokens)
            await supabase.auth.signOut();
            
            // Clear any additional local storage items if needed
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to login page
            router.push('/superadmin-login');
        } catch (error) {
            console.error('Error logging out:', error);
            setError('Failed to log out. Please try again.');
        }
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
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-lg border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                                <Crown className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">Super Admin Dashboard</h1>
                                <p className="text-slate-600">System Management & Administration</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600" />
                                <span className="text-slate-700 font-medium">Super Administrator</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 border border-red-200 hover:border-red-300"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}
            {success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <p className="text-green-700">{success}</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="min-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-lg border border-slate-200 w-fit mx-auto">
                        <button
                            onClick={() => setActiveTab('userManagement')}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'userManagement'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <Users className="h-5 w-5" />
                            <span>NTS Users</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('shipperUserManagement')}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'shipperUserManagement'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <Building2 className="h-5 w-5" />
                            <span>Shipper Users</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('templateManager')}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'templateManager'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <FileText className="h-5 w-5" />
                            <span>Templates</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'analytics'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <BarChart3 className="h-5 w-5" />
                            <span>Analytics</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'userManagement' && (
                    <div className="space-y-6">
                        {/* Action Bar */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">NTS User Management</h2>
                                    <p className="text-slate-600">Manage internal NTS users and their permissions</p>
                                </div>
                                <button
                                    onClick={() => setIsNtsUserModalOpen(true)}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                >
                                    <Plus className="h-5 w-5" />
                                    <span className="font-medium">Add New User</span>
                                </button>
                            </div>
                        </div>

                        {/* User Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-600 text-sm font-medium">Total Users</p>
                                        <p className="text-3xl font-bold text-slate-800">{ntsUsers.length}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Users className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-600 text-sm font-medium">Active Sales Reps</p>
                                        <p className="text-3xl font-bold text-slate-800">
                                            {ntsUsers.filter(user => user.role === 'sales').length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Users className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-600 text-sm font-medium">Administrators</p>
                                        <p className="text-3xl font-bold text-slate-800">
                                            {ntsUsers.filter(user => ['admin', 'super_admin', 'superadmin'].includes(user.role)).length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Shield className="h-8 w-8 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Office</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {ntsUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-semibold text-sm">
                                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {user.first_name} {user.last_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                        ['admin', 'super_admin', 'superadmin'].includes(user.role)
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : user.role === 'sales'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : user.role === 'manager'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {user.role === 'sales' ? 'Sales Rep' : 
                                                         user.role === 'super_admin' || user.role === 'superadmin' ? 'Super Admin' :
                                                         user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{user.office || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {user.phone_number || 'N/A'}
                                                    {user.extension && (
                                                        <span className="text-slate-400"> ext. {user.extension}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleEditNtsUser(user)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                                            title="Edit User"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setUserToDelete(user)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'shipperUserManagement' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 min-h-[600px]">
                        <ShipperUserManagement />
                    </div>
                )}

                {activeTab === 'templateManager' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 min-h-[600px]">
                        <TemplateManager />
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 min-h-[600px]">
                        <AdminAnalytics />
                    </div>
                )}
            </div>
            
            {/* Modals */}
            <AddNtsUserForm
                isOpen={isNtsUserModalOpen}
                onClose={() => setIsNtsUserModalOpen(false)}
                onSuccess={() => {
                    setSuccess('NTS User added successfully');
                    fetchNtsUsers();
                    setTimeout(() => setSuccess(null), 5000);
                }}
                ntsUsers={ntsUsers}
            />
            
            {selectedUser && (
                <EditNtsUserForm
                    user={selectedUser}
                    onClose={handleCloseEditForm}
                    onSave={handleSaveEditForm}
                />
            )}
            {/* Enhanced Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-lg mx-4 transform transition-all duration-300">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Confirm Deletion</h2>
                                <p className="text-slate-600">This action cannot be undone</p>
                            </div>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800 mb-3">
                                You are about to permanently delete the user account for:
                            </p>
                            <div className="bg-white rounded-lg p-3 border border-red-200">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {userToDelete.first_name?.[0]}{userToDelete.last_name?.[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {userToDelete.first_name} {userToDelete.last_name}
                                        </p>
                                        <p className="text-sm text-slate-600">{userToDelete.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                Type the user's email address to confirm deletion:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder={userToDelete.email}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-800 placeholder-slate-400"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setUserToDelete(null);
                                    setDeleteConfirmation('');
                                }}
                                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteNtsUser(userToDelete.id)}
                                disabled={deleteConfirmation !== userToDelete.email || loading}
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    deleteConfirmation === userToDelete.email && !loading
                                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Deleting...</span>
                                    </div>
                                ) : (
                                    'Confirm Deletion'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperadminDashboard;