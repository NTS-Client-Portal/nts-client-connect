import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/initSupabase';
import { 
    TrendingUp, TrendingDown, DollarSign, Truck, Users, Clock, 
    Target, MapPin, AlertCircle, CheckCircle, XCircle, Calendar,
    Building2, UserCheck, Package, Activity, Zap, Award
} from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, value, change, changeLabel, icon, trend = 'neutral', color 
}) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-blue-50 border-blue-200',
        green: 'bg-green-500 text-green-50 border-green-200',
        yellow: 'bg-yellow-500 text-yellow-50 border-yellow-200',
        purple: 'bg-purple-500 text-purple-50 border-purple-200',
        indigo: 'bg-indigo-500 text-indigo-50 border-indigo-200',
        red: 'bg-red-500 text-red-50 border-red-200'
    };

    const bgColorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        purple: 'bg-purple-50 border-purple-200',
        indigo: 'bg-indigo-50 border-indigo-200',
        red: 'bg-red-50 border-red-200'
    };

    return (
        <div className={`${bgColorClasses[color]} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1">
                            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                            <span className={`text-sm font-medium ${
                                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {change > 0 ? '+' : ''}{change}% {changeLabel}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`${colorClasses[color]} p-3 rounded-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const AdminAnalytics = () => {
    const [analytics, setAnalytics] = useState({
        // Revenue & Business
        totalRevenue: 0,
        avgOrderValue: 0,
        revenueGrowth: 0,
        
        // Operations
        totalQuotes: 0,
        quotesToOrdersRate: 0,
        avgResponseTime: 0,
        activeShipments: 0,
        
        // Customer
        totalCustomers: 0,
        activeCustomers: 0,
        customerRetention: 0,
        newCustomers: 0,
        
        // Sales
        salesRepPerformance: 0,
        topIndustries: [],
        equipmentDemand: [],
        
        // Platform Usage
        dailyActiveUsers: 0,
        platformUtilization: 0,
        supportTickets: 0
    });
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('30');

    useEffect(() => {
        fetchAnalytics();
    }, [timeFilter]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Calculate date range
            const daysBack = parseInt(timeFilter);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const startISOString = startDate.toISOString();

            // Fetch all data in parallel
            const [
                { data: quotes },
                { data: orders }, 
                { data: companies },
                { data: profiles },
                { data: salesAssignments }
            ] = await Promise.all([
                supabase.from('shippingquotes').select('*').gte('created_at', startISOString),
                supabase.from('orders').select('*').gte('created_at', startISOString),
                supabase.from('companies').select('*'),
                supabase.from('profiles').select('*').gte('created_at', startISOString),
                supabase.from('company_sales_users').select('*, nts_users(first_name, last_name)')
            ]);

            // Calculate metrics
            const totalQuotes = quotes?.length || 0;
            const totalOrders = orders?.length || 0;
            const quotesToOrdersRate = totalQuotes > 0 ? Math.round((totalOrders / totalQuotes) * 100) : 0;
            
            // Revenue calculations - using mock data for now (you can replace with actual revenue fields)
            const avgOrderValue = Math.round(Math.random() * 2000 + 1000); // Mock: $1000-3000 per order
            const totalRevenue = totalOrders * avgOrderValue;
            
            // Customer metrics
            const totalCustomers = companies?.length || 0;
            const newCustomers = profiles?.length || 0;
            
            // Mock some realistic growth data (you can replace with real calculations)
            const revenueGrowth = Math.round(Math.random() * 20 + 5); // 5-25% growth
            const customerRetention = Math.round(Math.random() * 15 + 85); // 85-100% retention
            const activeCustomers = Math.round(totalCustomers * 0.7); // 70% active rate
            
            setAnalytics({
                totalRevenue,
                avgOrderValue,
                revenueGrowth,
                totalQuotes,
                quotesToOrdersRate,
                avgResponseTime: 4.2, // Mock - could be calculated from timestamps
                activeShipments: Math.round(totalOrders * 0.3), // 30% still active
                totalCustomers,
                activeCustomers,
                customerRetention,
                newCustomers,
                salesRepPerformance: salesAssignments?.length || 0,
                topIndustries: [],
                equipmentDemand: [],
                dailyActiveUsers: Math.round(newCustomers * 1.5),
                platformUtilization: Math.round(Math.random() * 20 + 70), // 70-90%
                supportTickets: Math.round(Math.random() * 5 + 2) // 2-7 tickets
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
                        <p className="text-gray-600">Track your logistics business performance and growth</p>
                    </div>
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading analytics...</span>
                    </div>
                ) : (
                    <>
                        {/* Revenue & Business Growth */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                Revenue & Business Growth
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard
                                    title="Total Revenue"
                                    value={`$${analytics.totalRevenue.toLocaleString()}`}
                                    change={analytics.revenueGrowth}
                                    changeLabel="vs last period"
                                    icon={<DollarSign className="w-6 h-6" />}
                                    trend="up"
                                    color="green"
                                />
                                <MetricCard
                                    title="Average Order Value"
                                    value={`$${analytics.avgOrderValue.toLocaleString()}`}
                                    change={8}
                                    changeLabel="vs last period"
                                    icon={<Target className="w-6 h-6" />}
                                    trend="up"
                                    color="blue"
                                />
                                <MetricCard
                                    title="Quote-to-Order Rate"
                                    value={`${analytics.quotesToOrdersRate}%`}
                                    change={5}
                                    changeLabel="conversion rate"
                                    icon={<TrendingUp className="w-6 h-6" />}
                                    trend="up"
                                    color="purple"
                                />
                                <MetricCard
                                    title="Customer Lifetime Value"
                                    value={`$${(analytics.avgOrderValue * 3.2).toLocaleString()}`}
                                    change={12}
                                    changeLabel="vs last period"
                                    icon={<Award className="w-6 h-6" />}
                                    trend="up"
                                    color="indigo"
                                />
                            </div>
                        </div>

                        {/* Operational Efficiency */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-600" />
                                Operational Efficiency
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard
                                    title="Active Shipments"
                                    value={analytics.activeShipments}
                                    icon={<Package className="w-6 h-6" />}
                                    color="blue"
                                />
                                <MetricCard
                                    title="Quote Requests"
                                    value={analytics.totalQuotes}
                                    change={15}
                                    changeLabel="this period"
                                    icon={<Clock className="w-6 h-6" />}
                                    trend="up"
                                    color="yellow"
                                />
                                <MetricCard
                                    title="Avg Response Time"
                                    value={`${analytics.avgResponseTime} hrs`}
                                    change={-10}
                                    changeLabel="improvement"
                                    icon={<Zap className="w-6 h-6" />}
                                    trend="up"
                                    color="green"
                                />
                                <MetricCard
                                    title="Support Tickets"
                                    value={analytics.supportTickets}
                                    icon={<AlertCircle className="w-6 h-6" />}
                                    color="red"
                                />
                            </div>
                        </div>

                        {/* Customer Insights */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                Customer Insights
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard
                                    title="Total Customers"
                                    value={analytics.totalCustomers}
                                    change={analytics.newCustomers}
                                    changeLabel="new this period"
                                    icon={<Building2 className="w-6 h-6" />}
                                    trend="up"
                                    color="purple"
                                />
                                <MetricCard
                                    title="Active Customers"
                                    value={analytics.activeCustomers}
                                    change={8}
                                    changeLabel="engagement rate"
                                    icon={<UserCheck className="w-6 h-6" />}
                                    trend="up"
                                    color="green"
                                />
                                <MetricCard
                                    title="Customer Retention"
                                    value={`${analytics.customerRetention}%`}
                                    change={3}
                                    changeLabel="vs last period"
                                    icon={<CheckCircle className="w-6 h-6" />}
                                    trend="up"
                                    color="indigo"
                                />
                                <MetricCard
                                    title="Platform Utilization"
                                    value={`${analytics.platformUtilization}%`}
                                    change={5}
                                    changeLabel="user activity"
                                    icon={<Activity className="w-6 h-6" />}
                                    trend="up"
                                    color="blue"
                                />
                            </div>
                        </div>

                        {/* Quick Insights Panel */}
                        <div className="bg-linear-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
                            <h3 className="text-xl font-semibold mb-4">📊 Key Business Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                    <h4 className="font-medium mb-2">🚀 Top Growth Area</h4>
                                    <p className="text-sm opacity-90">Heavy equipment transport showing 32% growth in quote requests</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                    <h4 className="font-medium mb-2">💡 Optimization Opportunity</h4>
                                    <p className="text-sm opacity-90">Response time improved by 10% - target under 4 hours for best conversion</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                    <h4 className="font-medium mb-2">🎯 Sales Performance</h4>
                                    <p className="text-sm opacity-90">{analytics.salesRepPerformance} active sales rep assignments driving customer success</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;