import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import UserLayout from '@/pages/components/UserLayout';
import { formatQuoteId, parseQuoteId } from '@/lib/quoteUtils';
import { formatDate, freightTypeMapping } from '@/components/user/quotetabs/QuoteUtils';
import { getStatusLabel, getStatusStyle } from '@/lib/statusManagement';
import OrderDocuments from '@/components/user/orders/OrderDocuments';
import ShipmentStatusHistory from '@/components/user/orders/ShipmentStatusHistory';
import CarrierInfoCard from '@/components/user/orders/CarrierInfoCard';
import {
    ArrowLeft,
    MapPin,
    Package,
    Truck,
    ClipboardCheck,
    PackageCheck,
    Navigation,
    CheckCircle2,
    Radio,
    RefreshCw,
    Info,
    Clock,
    Copy,
    ExternalLink,
} from 'lucide-react';

type ShippingQuote = Database['public']['Tables']['shippingquotes']['Row'];

// Rows from the tracking tables added in migration 008. These aren't in the
// generated Database type yet, so we describe just the fields we read.
interface TrackingLocation {
    id: number;
    quote_id: number;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    state_province: string | null;
    uncertainty_miles: number | null;
    created_at_utc: string | null;
}

interface TrackingEvent {
    id: number;
    quote_id: number;
    stop_type: string | null;   // PickUp | DropOff
    event_name: string | null;  // Arrived | Departed
    completed_at_utc: string | null;
}

// Shipment lifecycle stages used for the tracking timeline.
const TRACKING_STAGES = [
    { key: 'confirmed', label: 'Order Confirmed', icon: ClipboardCheck },
    { key: 'picked_up', label: 'Picked Up', icon: PackageCheck },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
] as const;

// Map a quote/order status string to the index of the current tracking stage.
const getCurrentStageIndex = (status: string | null): number => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) return 3;
    if (s.includes('transit')) return 2;
    if (s.includes('picked')) return 1;
    // Any active order that isn't yet dispatched sits at "Order Confirmed".
    return 0;
};

// Prefer real MacroPoint stop events for the stage; fall back to the status.
const getStageFromEvents = (events: TrackingEvent[], status: string | null): number => {
    let stage = -1;
    for (const e of events) {
        const stop = (e.stop_type || '').toLowerCase();
        const name = (e.event_name || '').toLowerCase();
        if (stop.includes('drop') && name.includes('arriv')) stage = Math.max(stage, 3);
        else if (stop.includes('pick') && name.includes('depart')) stage = Math.max(stage, 2);
        else if (stop.includes('pick') && name.includes('arriv')) stage = Math.max(stage, 1);
    }
    return stage >= 0 ? stage : getCurrentStageIndex(status);
};

const formatDateTime = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
};

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-sm text-slate-800">{value || 'N/A'}</p>
    </div>
);

const OrderDetailPage: React.FC = () => {
    const router = useRouter();
    const { session, isLoading: authLoading } = useSessionContext();
    const supabase = useSupabaseClient<Database>();

    // Once auth has settled, send unauthenticated users to the login page
    // instead of leaving them stuck on the "Loading order…" spinner.
    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/');
        }
    }, [authLoading, session, router]);

    const { orderId } = router.query;
    const [order, setOrder] = useState<ShippingQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [locations, setLocations] = useState<TrackingLocation[]>([]);
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reordering, setReordering] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!router.isReady || authLoading) return;

        if (!session?.user?.id) {
            // Auth finished with no session — stop loading (redirect handled above).
            setLoading(false);
            return;
        }

        const raw = Array.isArray(orderId) ? orderId[0] : orderId;
        const numericId = parseQuoteId(raw || '');

        if (!raw || Number.isNaN(numericId)) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('id', numericId)
            .maybeSingle();

        if (error) {
            console.error('Error loading order:', error.message);
            setNotFound(true);
        } else if (!data) {
            setNotFound(true);
        } else {
            setOrder(data);
        }
        setLoading(false);
    }, [router.isReady, authLoading, orderId, session?.user?.id, supabase]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    // Poll the tracking tables (RLS-scoped) so the map/timeline go live the
    // moment MacroPoint starts pushing data. Realtime could replace this later.
    const fetchTracking = useCallback(async () => {
        if (!order?.id) return;
        try {
            const anyDb = supabase as any;
            const [{ data: locData }, { data: evtData }] = await Promise.all([
                anyDb
                    .from('tracking_locations')
                    .select('id, quote_id, latitude, longitude, city, state_province, uncertainty_miles, created_at_utc')
                    .eq('quote_id', order.id)
                    .order('created_at_utc', { ascending: false })
                    .limit(50),
                anyDb
                    .from('tracking_events')
                    .select('id, quote_id, stop_type, event_name, completed_at_utc')
                    .eq('quote_id', order.id)
                    .order('completed_at_utc', { ascending: true }),
            ]);
            setLocations((locData as TrackingLocation[]) || []);
            setEvents((evtData as TrackingEvent[]) || []);
        } catch {
            // Tracking tables may not exist until migration 008 is applied.
            // Fail quietly — the page still shows order detail + placeholder.
        }
    }, [order?.id, supabase]);

    useEffect(() => {
        if (!order?.id) return;
        fetchTracking();
        const interval = setInterval(fetchTracking, 20000);
        return () => clearInterval(interval);
    }, [order?.id, fetchTracking]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchTracking();
        } finally {
            setRefreshing(false);
        }
    }, [fetchTracking]);

    // Idea 7 — Reorder / repeat lane. Duplicate this shipment into a fresh
    // quote (same freight + route + PO), reset to 'quote' with no price, so the
    // shipper can re-request a recurring lane in one click.
    const handleReorder = useCallback(async () => {
        if (!order || !session?.user?.id) return;
        setReordering(true);
        try {
            const {
                id,
                inserted_at,
                created_at,
                price,
                status,
                is_complete,
                is_archived,
                ...rest
            } = order as any;
            const newQuote = {
                ...rest,
                user_id: session.user.id,
                status: 'quote',
                price: null,
                created_at: new Date().toISOString(),
            };
            const { error } = await (supabase.from('shippingquotes') as any)
                .insert([newQuote])
                .select()
                .single();
            if (error) {
                console.error('Error reordering shipment:', error.message);
            } else {
                router.push('/user/logistics-management');
            }
        } finally {
            setReordering(false);
        }
    }, [order, session?.user?.id, supabase, router]);

    const latestLocation = locations[0] || null;
    // Derive the stage from real tracking events when available, otherwise fall
    // back to the broker milestone (brokers_status), then the top-level status.
    const currentStage = getStageFromEvents(
        events,
        (order as any)?.brokers_status || order?.status || null
    );
    const isDelivered = currentStage >= 3 || (order?.status || '').toLowerCase().includes('deliver');
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasLiveLocation = !!(latestLocation && latestLocation.latitude != null && latestLocation.longitude != null);
    const trackingShareUrl = (order as any)?.tracking_share_url as string | null | undefined;

    return (
        <UserLayout>
            <div className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    {/* Back link */}
                    <Link
                        href="/user/logistics-management"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Orders
                    </Link>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                                <p className="text-sm">Loading order…</p>
                            </div>
                        </div>
                    ) : notFound || !order ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                            <Info className="h-8 w-8 text-slate-300" />
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Order not found</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    We couldn&apos;t find this order, or you don&apos;t have access to it.
                                </p>
                            </div>
                            <Link
                                href="/user/logistics-management"
                                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                Return to Orders
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-700 shadow-lg">
                                <Truck className="pointer-events-none absolute -right-6 -bottom-8 h-44 w-44 text-white/10" />
                                <div className="relative flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
                                            <Truck className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                                    {formatQuoteId(order.id)}
                                                </h1>
                                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(order.status as any)}`}>
                                                    {getStatusLabel(order.status as any) || order.status || 'In Progress'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-blue-100">
                                                {order.origin_city}, {order.origin_state} &rarr; {order.destination_city}, {order.destination_state}
                                            </p>
                                            {(order as any).po_number && (
                                                <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white">
                                                    PO: {(order as any).po_number}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {order.price ? (
                                        <div className="rounded-xl bg-white/10 px-5 py-3 text-right backdrop-blur-sm">
                                            <p className="text-xs font-medium uppercase tracking-wide text-blue-100">Order Value</p>
                                            <p className="text-2xl font-bold text-white">${order.price}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-blue-50">
                                            <Clock className="h-4 w-4" />
                                            Awaiting rate
                                        </div>
                                    )}
                                </div>
                                <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-500" />
                            </div>

                            {/* Reorder action */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleReorder}
                                    disabled={reordering}
                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:opacity-60"
                                >
                                    {reordering ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                    {reordering ? 'Creating\u2026' : 'Reorder this shipment'}
                                </button>
                            </div>

                            {/* Live Tracking */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Navigation className="h-5 w-5 text-blue-600" />
                                        <h3 className="text-base font-semibold text-slate-900">Live Tracking</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {trackingShareUrl && (
                                            <a
                                                href={trackingShareUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                View live tracking
                                            </a>
                                        )}
                                        <button
                                            onClick={handleRefresh}
                                            disabled={refreshing}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                            Refresh location
                                        </button>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                            <Radio className="h-3 w-3" />
                                            {isDelivered ? 'Completed' : 'Tracking active'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Progress timeline */}
                                    <div className="flex items-center">
                                        {TRACKING_STAGES.map((stage, i) => {
                                            const Icon = stage.icon;
                                            const done = i < currentStage || isDelivered;
                                            const active = i === currentStage && !isDelivered;
                                            const reached = done || active;
                                            return (
                                                <React.Fragment key={stage.key}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div
                                                            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
                                                                done
                                                                    ? 'border-green-500 bg-green-500 text-white'
                                                                    : active
                                                                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                                    : 'border-slate-200 bg-white text-slate-300'
                                                            }`}
                                                        >
                                                            {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                                        </div>
                                                        <span
                                                            className={`text-center text-[11px] font-medium ${
                                                                reached ? 'text-slate-800' : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {stage.label}
                                                        </span>
                                                    </div>
                                                    {i < TRACKING_STAGES.length - 1 && (
                                                        <div
                                                            className={`mx-1 mb-6 h-0.5 flex-1 rounded ${
                                                                i < currentStage || isDelivered ? 'bg-green-500' : 'bg-slate-200'
                                                            }`}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>

                                    {/* Live map (renders once a location ping exists).
                                        Uses Google Maps when a key is configured, otherwise
                                        falls back to a key-free OpenStreetMap embed so the
                                        in-app map works with no external setup. */}
                                    {hasLiveLocation ? (
                                        <div className="mt-6 space-y-2">
                                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                                <iframe
                                                    title="Live shipment location"
                                                    width="100%"
                                                    height="320"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    src={
                                                        mapsKey
                                                            ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${latestLocation!.latitude},${latestLocation!.longitude}&zoom=8`
                                                            : `https://www.openstreetmap.org/export/embed.html?bbox=${latestLocation!.longitude! - 1.2}%2C${latestLocation!.latitude! - 0.8}%2C${latestLocation!.longitude! + 1.2}%2C${latestLocation!.latitude! + 0.8}&layer=mapnik&marker=${latestLocation!.latitude}%2C${latestLocation!.longitude}`
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                    {latestLocation!.city && latestLocation!.state_province
                                                        ? `Near ${latestLocation!.city}, ${latestLocation!.state_province}`
                                                        : `${latestLocation!.latitude?.toFixed(4)}, ${latestLocation!.longitude?.toFixed(4)}`}
                                                    {latestLocation!.uncertainty_miles != null && ` (±${latestLocation!.uncertainty_miles} mi)`}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Updated {formatDateTime(latestLocation!.created_at_utc)}
                                                </span>
                                            </div>
                                            {trackingShareUrl && (
                                                <div className="pt-1">
                                                    <a
                                                        href={trackingShareUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Open full MacroPoint tracking
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                                            <MapPin className="h-8 w-8 text-slate-300" />
                                            <p className="text-sm font-medium text-slate-600">
                                                {isDelivered
                                                    ? 'This shipment has been delivered.'
                                                    : 'Live GPS location will appear here once the carrier is dispatched.'}
                                            </p>
                                            <p className="text-xs text-slate-400">Powered by MacroPoint — updates automatically once tracking starts.</p>
                                            {trackingShareUrl && (
                                                <a
                                                    href={trackingShareUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Open live MacroPoint tracking
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status history (broker milestone timeline) */}
                            <ShipmentStatusHistory
                                quoteId={order.id}
                                currentStatus={(order as any).brokers_status || order.status}
                            />

                            {/* Carrier information (broker-optional, shown after dispatch) */}
                            <CarrierInfoCard order={order} />

                            {/* Route Information */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-base font-semibold text-slate-900">Route Information</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                                    {/* Pickup */}
                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                                                <MapPin className="h-3.5 w-3.5 text-green-600" />
                                            </span>
                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700">Pickup Address</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <DetailRow label="Contact" value={order.origin_name} />
                                            <DetailRow label="Phone" value={order.origin_phone} />
                                            <DetailRow
                                                label="Address"
                                                value={
                                                    <>
                                                        {order.origin_street && <span className="block">{order.origin_street}</span>}
                                                        <span className="block">
                                                            {order.origin_city}, {order.origin_state} {order.origin_zip}
                                                        </span>
                                                    </>
                                                }
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <DetailRow label="Earliest" value={formatDate(order.earliest_pickup_date)} />
                                                <DetailRow label="Latest" value={formatDate(order.latest_pickup_date)} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery */}
                                    <div className="md:border-l md:border-slate-100 md:pl-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                                                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                            </span>
                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Delivery Address</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <DetailRow label="Contact" value={order.destination_name} />
                                            <DetailRow label="Phone" value={order.destination_phone} />
                                            <DetailRow
                                                label="Address"
                                                value={
                                                    <>
                                                        {order.destination_street && <span className="block">{order.destination_street}</span>}
                                                        <span className="block">
                                                            {order.destination_city}, {order.destination_state} {order.destination_zip}
                                                        </span>
                                                    </>
                                                }
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <DetailRow label="Due Date" value={formatDate(order.due_date)} />
                                                <DetailRow
                                                    label="Special Req."
                                                    value={order.loading_unloading_requirements ? 'Yes' : 'None'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Load Details + Additional Info */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                                        <Package className="h-5 w-5 text-purple-600" />
                                        <h3 className="text-base font-semibold text-slate-900">Load Details</h3>
                                    </div>
                                    <div className="space-y-4 p-6">
                                        <DetailRow
                                            label="Type"
                                            value={freightTypeMapping[order.freight_type?.toLowerCase() || ''] || order.freight_type}
                                        />
                                        {order.freight_type?.toLowerCase() === 'equipment' && (
                                            <DetailRow label="Equipment" value={`${order.year || ''} ${order.make || ''} ${order.model || ''}`.trim()} />
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <DetailRow
                                                label="Dimensions"
                                                value={
                                                    [
                                                        order.length && `${order.length}${order.length_unit || 'ft'}`,
                                                        order.width && `${order.width}${order.width_unit || 'ft'}`,
                                                        order.height && `${order.height}${order.height_unit || 'ft'}`,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' × ') || 'N/A'
                                                }
                                            />
                                            <DetailRow
                                                label="Weight"
                                                value={order.weight ? `${order.weight} ${order.weight_unit || 'lbs'}` : 'N/A'}
                                            />
                                        </div>
                                        <DetailRow label="Operational" value={order.operational_condition ? 'Yes' : 'No'} />
                                        {order.commodity && <DetailRow label="Commodity" value={order.commodity} />}
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                                        <Info className="h-5 w-5 text-orange-500" />
                                        <h3 className="text-base font-semibold text-slate-900">Additional Information</h3>
                                    </div>
                                    <div className="space-y-4 p-6">
                                        <DetailRow
                                            label="Loading/Unloading Requirements"
                                            value={order.loading_unloading_requirements || 'None'}
                                        />
                                        <DetailRow label="Notes" value={order.notes} />
                                        <DetailRow label="Order Placed" value={formatDate(order.inserted_at)} />
                                    </div>
                                </div>
                            </div>

                            {/* Order Documents */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                    <p className="text-xs text-slate-500">
                                        Attach paperwork (BOL, invoice, photos) to this order. Files are private to your company.
                                    </p>
                                </div>
                                <div className="p-6">
                                    <OrderDocuments quoteId={order.id} userId={session?.user?.id} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
};

export default OrderDetailPage;
