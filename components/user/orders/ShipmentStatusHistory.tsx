import React, { useCallback, useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { History, Clock, CircleDot } from 'lucide-react';

interface AuditRow {
    id: number;
    old_status: string | null;
    new_status: string | null;
    old_brokers_status: string | null;
    new_brokers_status: string | null;
    changed_at: string | null;
    change_reason: string | null;
}

interface ShipmentStatusHistoryProps {
    quoteId: number;
    /** Current broker status, used as a fallback when no audit rows exist. */
    currentStatus?: string | null;
    className?: string;
}

const STATUS_LABEL: Record<string, string> = {
    in_progress: 'In Progress',
    need_more_info: 'Needs More Info',
    priced: 'Priced',
    dispatched: 'Dispatched',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_DOT: Record<string, string> = {
    in_progress: 'text-blue-500',
    need_more_info: 'text-amber-500',
    priced: 'text-indigo-500',
    dispatched: 'text-purple-500',
    picked_up: 'text-orange-500',
    delivered: 'text-green-600',
    cancelled: 'text-red-500',
};

const labelFor = (raw?: string | null): string => {
    if (!raw) return '—';
    return STATUS_LABEL[raw] || raw.replace(/_/g, ' ');
};

const formatWhen = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
};

/**
 * Idea 1 — Shipment Progress Timeline.
 * Surfaces the timestamped broker status history from quote_status_audit so
 * the shipper can see exactly when each milestone happened, without emailing.
 * The audit table isn't in the generated types yet, so the query is cast.
 */
const ShipmentStatusHistory: React.FC<ShipmentStatusHistoryProps> = ({
    quoteId,
    currentStatus,
    className = '',
}) => {
    const supabase = useSupabaseClient();
    const [rows, setRows] = useState<AuditRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [unavailable, setUnavailable] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await (supabase as any)
            .from('quote_status_audit')
            .select('id, old_status, new_status, old_brokers_status, new_brokers_status, changed_at, change_reason')
            .eq('quote_id', quoteId)
            .order('changed_at', { ascending: false });

        if (error) {
            // Table may not exist until migration 005 is applied — fail quietly.
            setUnavailable(true);
        } else {
            setRows((data as AuditRow[]) || []);
        }
        setLoading(false);
    }, [supabase, quoteId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <History className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-slate-900">Status History</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                </div>
            </div>
        );
    }

    // Build the list of milestones to render. Prefer the real audit trail; if
    // there isn't one yet, show the current status as a single entry.
    const milestones =
        rows.length > 0
            ? rows.map((r) => ({
                  key: r.id,
                  status: r.new_brokers_status || r.new_status,
                  when: r.changed_at,
                  reason: r.change_reason,
              }))
            : currentStatus
            ? [{ key: 'current', status: currentStatus, when: null as string | null, reason: null as string | null }]
            : [];

    if (unavailable && rows.length === 0 && !currentStatus) return null;

    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                <History className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900">Status History</h3>
            </div>
            <div className="p-6">
                {milestones.length === 0 ? (
                    <p className="text-sm text-slate-500">No status updates yet.</p>
                ) : (
                    <ol className="relative space-y-5">
                        {milestones.map((m, i) => {
                            const dot = STATUS_DOT[m.status || ''] || 'text-slate-400';
                            const isLatest = i === 0;
                            return (
                                <li key={m.key} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <CircleDot className={`h-4 w-4 ${isLatest ? dot : 'text-slate-300'}`} />
                                        {i < milestones.length - 1 && (
                                            <span className="mt-1 w-px flex-1 bg-slate-200" />
                                        )}
                                    </div>
                                    <div className="-mt-0.5 pb-1">
                                        <p
                                            className={`text-sm font-semibold ${
                                                isLatest ? 'text-slate-900' : 'text-slate-600'
                                            }`}
                                        >
                                            {labelFor(m.status)}
                                            {isLatest && (
                                                <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        {m.when && (
                                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                {formatWhen(m.when)}
                                            </p>
                                        )}
                                        {m.reason && <p className="mt-0.5 text-xs text-slate-500">{m.reason}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </div>
    );
};

export default ShipmentStatusHistory;
