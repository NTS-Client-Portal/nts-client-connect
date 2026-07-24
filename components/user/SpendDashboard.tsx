import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { DollarSign, Package, TrendingUp, Route, BarChart3, Layers } from 'lucide-react';

// Minimal shape we need for analytics — kept local so this works even if a
// column isn't yet in the generated types.
interface SpendRow {
    id: number;
    price: number | string | null;
    status: string | null;
    is_complete: boolean | null;
    is_archived: boolean | null;
    created_at: string | null;
    inserted_at: string | null;
    freight_type: string | null;
    origin_city: string | null;
    origin_state: string | null;
    destination_city: string | null;
    destination_state: string | null;
}

type Period = '90d' | '12m' | 'all';

const PERIODS: { key: Period; label: string }[] = [
    { key: '90d', label: 'Last 90 days' },
    { key: '12m', label: 'Last 12 months' },
    { key: 'all', label: 'All time' },
];

const FREIGHT_LABELS: Record<string, string> = {
    equipment: 'Heavy Equipment',
    vehicles: 'Vehicles',
    containers: 'Containers',
    ltl: 'LTL / Partial',
    ftl: 'Full Truckload',
    boats: 'Boats',
    auto: 'Auto',
};

const toNumber = (v: number | string | null): number => {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[$,]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

const money = (n: number): string =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const rowDate = (r: SpendRow): Date | null => {
    const raw = r.created_at || r.inserted_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
};

const SpendDashboard: React.FC = () => {
    const session = useSession();
    const [rows, setRows] = useState<SpendRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('12m');

    const fetchRows = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('shippingquotes')
            .select(
                'id, price, status, is_complete, is_archived, created_at, inserted_at, freight_type, origin_city, origin_state, destination_city, destination_state'
            )
            .eq('user_id', session.user.id);
        if (error) {
            console.error('Error loading spend analytics:', error.message);
            setRows([]);
        } else {
            setRows((data as unknown as SpendRow[]) || []);
        }
        setLoading(false);
    }, [session?.user?.id]);

    useEffect(() => {
        if (session) fetchRows();
    }, [session, fetchRows]);

    const analytics = useMemo(() => {
        const now = new Date();
        const cutoff =
            period === '90d'
                ? new Date(now.getTime() - 90 * 24 * 3600 * 1000)
                : period === '12m'
                  ? new Date(new Date().setMonth(now.getMonth() - 12))
                  : new Date(0);

        // A "booked shipment" is any non-archived row with a real price.
        const booked = rows.filter((r) => {
            if (r.is_archived) return false;
            if (toNumber(r.price) <= 0) return false;
            const d = rowDate(r);
            return d ? d >= cutoff : true;
        });

        const totalSpend = booked.reduce((s, r) => s + toNumber(r.price), 0);
        const shipmentCount = booked.length;
        const avgPerShipment = shipmentCount ? totalSpend / shipmentCount : 0;
        const activeCount = booked.filter(
            (r) => (r.status || '').toLowerCase() === 'order' && !r.is_complete
        ).length;
        const deliveredCount = booked.filter((r) => r.is_complete).length;

        // Spend by month (chronological, only within the selected window; cap 12).
        const monthMap = new Map<string, number>();
        for (const r of booked) {
            const d = rowDate(r);
            if (!d) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthMap.set(key, (monthMap.get(key) || 0) + toNumber(r.price));
        }
        const monthly = Array.from(monthMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-12)
            .map(([key, value]) => {
                const [y, m] = key.split('-');
                const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', {
                    month: 'short',
                });
                return { key, label, value };
            });
        const maxMonth = Math.max(1, ...monthly.map((m) => m.value));

        // Top lanes by spend.
        const laneMap = new Map<string, { spend: number; count: number }>();
        for (const r of booked) {
            const lane = `${r.origin_city || '—'}, ${r.origin_state || ''} → ${r.destination_city || '—'}, ${r.destination_state || ''}`;
            const cur = laneMap.get(lane) || { spend: 0, count: 0 };
            cur.spend += toNumber(r.price);
            cur.count += 1;
            laneMap.set(lane, cur);
        }
        const topLanes = Array.from(laneMap.entries())
            .map(([lane, v]) => ({ lane, ...v }))
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 5);
        const maxLane = Math.max(1, ...topLanes.map((l) => l.spend));

        // Freight mix by count.
        const mixMap = new Map<string, number>();
        for (const r of booked) {
            const t = (r.freight_type || 'other').toLowerCase();
            mixMap.set(t, (mixMap.get(t) || 0) + 1);
        }
        const freightMix = Array.from(mixMap.entries())
            .map(([type, count]) => ({
                type,
                label: FREIGHT_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1),
                count,
                pct: shipmentCount ? Math.round((count / shipmentCount) * 100) : 0,
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalSpend,
            shipmentCount,
            avgPerShipment,
            activeCount,
            deliveredCount,
            monthly,
            maxMonth,
            topLanes,
            maxLane,
            freightMix,
        };
    }, [rows, period]);

    const kpis = [
        {
            label: 'Total Spend',
            value: money(analytics.totalSpend),
            hint: 'Booked freight',
            icon: DollarSign,
            accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            bar: 'from-emerald-500 to-emerald-600',
        },
        {
            label: 'Shipments',
            value: String(analytics.shipmentCount),
            hint: `${analytics.activeCount} active · ${analytics.deliveredCount} delivered`,
            icon: Package,
            accent: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            bar: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Avg / Shipment',
            value: money(analytics.avgPerShipment),
            hint: 'Average booked rate',
            icon: TrendingUp,
            accent: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
            bar: 'from-violet-500 to-violet-600',
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spend &amp; Performance</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Your freight spend, lanes, and shipment mix
                        </p>
                    </div>
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-700/50">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                period === p.key
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600" />
                    </div>
                ) : analytics.shipmentCount === 0 ? (
                    <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No booked freight in this period yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* KPI tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {kpis.map(({ label, value, hint, icon: Icon, accent, bar }) => (
                                <div
                                    key={label}
                                    className="relative bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 p-5 overflow-hidden"
                                >
                                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${bar}`} />
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
                                        </div>
                                        <div className={`p-2.5 rounded-lg ${accent}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Monthly spend bar chart */}
                            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Spend</h3>
                                </div>
                                {analytics.monthly.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-8 text-center">Not enough data.</p>
                                ) : (
                                    <div className="flex items-end justify-between gap-2 h-40">
                                        {analytics.monthly.map((m) => (
                                            <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                    {m.value >= 1000 ? `$${Math.round(m.value / 1000)}k` : money(m.value)}
                                                </span>
                                                <div className="w-full flex items-end justify-center h-28">
                                                    <div
                                                        className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all"
                                                        style={{ height: `${Math.max(4, (m.value / analytics.maxMonth) * 100)}%` }}
                                                        title={money(m.value)}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">{m.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Freight mix */}
                            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Layers className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Freight Mix</h3>
                                </div>
                                <div className="space-y-3">
                                    {analytics.freightMix.map((f) => (
                                        <div key={f.type}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{f.label}</span>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {f.count} · {f.pct}%
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                                    style={{ width: `${f.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top lanes */}
                        <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Route className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Lanes by Spend</h3>
                            </div>
                            <div className="space-y-3">
                                {analytics.topLanes.map((l) => (
                                    <div key={l.lane}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-3">
                                                {l.lane}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {money(l.spend)} · {l.count} {l.count === 1 ? 'load' : 'loads'}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                                style={{ width: `${Math.max(4, (l.spend / analytics.maxLane) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpendDashboard;
