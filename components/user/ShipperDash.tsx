import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Image from 'next/image';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import ShippingCalendar from './ShippingCalendar';
import { 
    Package, 
    Truck, 
    CheckCircle, 
    Clock, 
    TrendingUp, 
    Calendar,
    User,
    Mail,
    Phone,
    MapPin,
    DollarSign,
    AlertCircle,
    BarChart3
} from 'lucide-react';

type NtsUsersRow = Database['public']['Tables']['nts_users']['Row'];
type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];

interface DashboardStats {
    activeOrders: number;
    pendingQuotes: number;
    completedOrders: number;
    totalValue: number;
}

const ShipperDash = () => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<DashboardStats>({
        activeOrders: 0,
        pendingQuotes: 0,
        completedOrders: 0,
        totalValue: 0
    });
    const [recentOrders, setRecentOrders] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const { userProfile } = useProfilesUser();
    const session = useSession();

    // Fetch dashboard statistics
    const fetchDashboardStats = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            // Fetch active orders
            const { data: activeOrdersData } = await supabase
                .from('shippingquotes')
                .select('price')
                .eq('user_id', session.user.id)
                .eq('status', 'Order')
                .or('is_archived.is.null,is_archived.eq.false')
                .or('is_complete.is.null,is_complete.eq.false');

            // Fetch pending quotes
            const { data: pendingQuotesData } = await supabase
                .from('shippingquotes')
                .select('price')
                .eq('user_id', session.user.id)
                .eq('status', 'Quote')
                .or('is_archived.is.null,is_archived.eq.false');

            // Fetch completed orders
            const { data: completedOrdersData } = await supabase
                .from('shippingquotes')
                .select('price')
                .eq('user_id', session.user.id)
                .eq('is_complete', true);

            // Calculate stats
            const activeOrders = activeOrdersData?.length || 0;
            const pendingQuotes = pendingQuotesData?.length || 0;
            const completedOrders = completedOrdersData?.length || 0;
            const totalValue = [...(activeOrdersData || []), ...(completedOrdersData || [])]
                .reduce((sum, order) => sum + (order.price || 0), 0);

            setStats({
                activeOrders,
                pendingQuotes,
                completedOrders,
                totalValue
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setErrorText('Error loading dashboard statistics');
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    // Fetch recent orders for activity feed
    const fetchRecentOrders = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session.user.id)
            .or('status.eq.Order,status.eq.Quote')
            .or('is_archived.is.null,is_archived.eq.false')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching recent orders:', error);
        } else {
            setRecentOrders(data || []);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session) {
            fetchDashboardStats();
            fetchRecentOrders();
        }
    }, [session, fetchDashboardStats, fetchRecentOrders]);

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                        sales_user_id,
                            nts_users (
                                id,
                                first_name,
                                last_name,
                                email,
                                phone_number,
                                profile_picture
                            )
                    `)
                    .eq('company_id', userProfile.company_id);

                if (error) {
                    console.error('Error fetching assigned sales users:', error.message);
                } else if (data) {
                    setAssignedSalesUsers(data.map((item: any) => item.nts_users));
                }
            }
        };

        fetchAssignedSalesUsers();
    }, [userProfile]);

    const rep = assignedSalesUsers[0];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'quote':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'order':
                return <Truck className="w-4 h-4 text-blue-500" />;
            case 'delivered':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <Package className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'quote':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'order':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (errorText) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{errorText}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Welcome back! Here's your logistics overview
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <BarChart3 className="w-4 h-4" />
                            <span>Updated {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Orders</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeOrders}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Orders in progress</p>
                                    </div>
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                                        <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Quotes</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingQuotes}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting response</p>
                                    </div>
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                                        <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completedOrders}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Delivered orders</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalValue)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lifetime shipments</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar Section - Takes up 2 columns on large screens */}
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Schedule</h2>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            View and manage your pickup and delivery dates
                                        </p>
                                    </div>
                                    <div className="p-6">
                                        <ShippingCalendar />
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Sales Representative Card */}
                                {rep && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Representative</h3>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="text-center mb-6">
                                                {rep.profile_picture ? (
                                                    <Image
                                                        src={rep.profile_picture}
                                                        alt={`${rep.first_name} ${rep.last_name}`}
                                                        className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-100 dark:border-gray-700"
                                                        width={80}
                                                        height={80}
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto flex items-center justify-center border-4 border-gray-100 dark:border-gray-700">
                                                        <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                                    </div>
                                                )}
                                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                                                    {rep.first_name} {rep.last_name}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Logistics Representative</p>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                                                        <a 
                                                            href={`mailto:${rep.email}`}
                                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                                        >
                                                            {rep.email}
                                                        </a>
                                                    </div>
                                                </div>
                                                
                                                {rep.phone_number && (
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                                                            <a 
                                                                href={`tel:${rep.phone_number}`}
                                                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                            >
                                                                {rep.phone_number}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Recent Activity Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        {recentOrders.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {recentOrders.map((order) => (
                                                    <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        {getStatusIcon(order.status)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                Order #{order.id}
                                                            </p>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                {order.origin_city}, {order.origin_state} → {order.destination_city}, {order.destination_state}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShipperDash;