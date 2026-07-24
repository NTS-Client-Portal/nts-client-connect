import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
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
    AlertCircle,
    BarChart3,
    ArrowUpRight,
} from 'lucide-react';

interface DashboardStats {
    activeOrders: number;
    pendingQuotes: number;
    completedOrders: number;
}

// Demo account manager — mock data so no real rep PII is surfaced in the demo.
const ACCOUNT_MANAGER = {
    name: 'Jordan Avery',
    title: 'Dedicated Account Manager',
    email: 'jordan.avery@ntslogistics.com',
    phone: '(800) 555-0142',
};

const ShipperDash = () => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<DashboardStats>({
        activeOrders: 0,
        pendingQuotes: 0,
        completedOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const session = useSession();

    // Fetch dashboard statistics
    const fetchDashboardStats = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            // Fetch all shippingquotes for this user first
            const { data: allQuotes } = await supabase
                .from('shippingquotes')
                .select('price, status, is_archived, is_complete')
                .eq('user_id', session.user.id);

            // Filter for active orders with case-insensitive status check
            const activeOrdersData = allQuotes?.filter(quote => {
                const status = quote.status?.toLowerCase() || '';
                return status === 'order' && 
                       (quote.is_archived === null || quote.is_archived === false) &&
                       (quote.is_complete === null || quote.is_complete === false);
            });

            // Filter for pending quotes with case-insensitive status check
            const pendingQuotesData = allQuotes?.filter(quote => {
                const status = quote.status?.toLowerCase() || '';
                return status === 'quote' && (quote.is_archived === null || quote.is_archived === false);
            });

            // Filter for completed orders
            const completedOrdersData = allQuotes?.filter(quote => {
                return quote.is_complete === true;
            });

            setStats({
                activeOrders: activeOrdersData?.length || 0,
                pendingQuotes: pendingQuotesData?.length || 0,
                completedOrders: completedOrdersData?.length || 0,
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

    const statCards = [
        {
            label: 'Active Orders',
            value: stats.activeOrders,
            hint: 'Orders in progress',
            icon: Truck,
            accent: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            bar: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Pending Quotes',
            value: stats.pendingQuotes,
            hint: 'Awaiting response',
            icon: Clock,
            accent: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
            bar: 'from-amber-400 to-amber-500',
        },
        {
            label: 'Completed',
            value: stats.completedOrders,
            hint: 'Delivered orders',
            icon: CheckCircle,
            accent: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            bar: 'from-green-500 to-emerald-600',
        },
    ];

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
                        {/* Shipping Schedule — top of the page */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Schedule</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            View and manage your pickup and delivery dates
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6">
                                <ShippingCalendar />
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {statCards.map(({ label, value, hint, icon: Icon, accent, bar }) => (
                                <div
                                    key={label}
                                    className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${bar}`} />
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg ${accent}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity + Account Manager */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Activity */}
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        {recentOrders.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {recentOrders.map((order) => (
                                                    <div
                                                        key={order.id}
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                                                    >
                                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                                                            {getStatusIcon(order.status)}
                                                        </div>
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

                            {/* Account Manager */}
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Dedicated Account Manager</h3>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="text-center mb-6">
                                            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-semibold border-4 border-white dark:border-gray-700 shadow-sm">
                                                {ACCOUNT_MANAGER.name.split(' ').map((n) => n[0]).join('')}
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                                                {ACCOUNT_MANAGER.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{ACCOUNT_MANAGER.title}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <a
                                                href={`mailto:${ACCOUNT_MANAGER.email}`}
                                                className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            >
                                                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                                                        {ACCOUNT_MANAGER.email}
                                                    </p>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </a>

                                            <a
                                                href={`tel:${ACCOUNT_MANAGER.phone}`}
                                                className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            >
                                                <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                                        {ACCOUNT_MANAGER.phone}
                                                    </p>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </a>
                                        </div>
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
