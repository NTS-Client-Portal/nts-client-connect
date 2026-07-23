import React, { useCallback, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import {
    MapPin,
    Package,
    Plus,
    Trash2,
    Loader2,
    Building2,
    Save,
    X,
    AlertCircle,
} from 'lucide-react';

interface SavedLocation {
    id: number;
    label: string;
    location_type: string | null;
    contact_name: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
}

interface SavedFreight {
    id: number;
    label: string;
    freight_type: string | null;
    year: string | null;
    make: string | null;
    model: string | null;
    commodity: string | null;
    length: string | null;
    width: string | null;
    height: string | null;
    weight: string | null;
}

type Tab = 'locations' | 'freight';

const emptyLocation = { label: '', location_type: 'both', contact_name: '', phone: '', street: '', city: '', state: '', zip: '' };
const emptyFreight = { label: '', freight_type: '', year: '', make: '', model: '', commodity: '', length: '', width: '', height: '', weight: '' };

const SavedLibrary: React.FC = () => {
    const session = useSession();
    const supabase = useSupabaseClient<Database>();

    const [tab, setTab] = useState<Tab>('locations');
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [locations, setLocations] = useState<SavedLocation[]>([]);
    const [freight, setFreight] = useState<SavedFreight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);

    const [showLocForm, setShowLocForm] = useState(false);
    const [showFreightForm, setShowFreightForm] = useState(false);
    const [locForm, setLocForm] = useState({ ...emptyLocation });
    const [freightForm, setFreightForm] = useState({ ...emptyFreight });
    const [saving, setSaving] = useState(false);

    const fetchAll = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', session.user.id)
            .maybeSingle();
        setCompanyId(profile?.company_id ?? null);

        // saved_* tables added in migration 010; cast until types regenerate.
        const [{ data: locs }, { data: fr }] = await Promise.all([
            (supabase as any).from('saved_locations').select('*').order('created_at', { ascending: false }),
            (supabase as any).from('saved_freight').select('*').order('created_at', { ascending: false }),
        ]);
        setLocations((locs as SavedLocation[]) || []);
        setFreight((fr as SavedFreight[]) || []);
        setLoading(false);
    }, [session?.user?.id, supabase]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const addLocation = async () => {
        if (!locForm.label.trim()) {
            setError('Give this location a label.');
            return;
        }
        setSaving(true);
        setError('');
        const { error: insErr } = await (supabase as any).from('saved_locations').insert({
            ...locForm,
            user_id: session?.user?.id ?? null,
            company_id: companyId,
        });
        setSaving(false);
        if (insErr) {
            setError(insErr.message);
            return;
        }
        setLocForm({ ...emptyLocation });
        setShowLocForm(false);
        fetchAll();
    };

    const addFreight = async () => {
        if (!freightForm.label.trim()) {
            setError('Give this freight a label.');
            return;
        }
        setSaving(true);
        setError('');
        const { error: insErr } = await (supabase as any).from('saved_freight').insert({
            ...freightForm,
            user_id: session?.user?.id ?? null,
            company_id: companyId,
        });
        setSaving(false);
        if (insErr) {
            setError(insErr.message);
            return;
        }
        setFreightForm({ ...emptyFreight });
        setShowFreightForm(false);
        fetchAll();
    };

    const deleteItem = async (table: 'saved_locations' | 'saved_freight', id: number) => {
        setBusyId(id);
        const { error: delErr } = await (supabase as any).from(table).delete().eq('id', id);
        setBusyId(null);
        if (delErr) {
            setError(delErr.message);
            return;
        }
        if (table === 'saved_locations') setLocations((p) => p.filter((x) => x.id !== id));
        else setFreight((p) => p.filter((x) => x.id !== id));
    };

    const input = 'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm';

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Saved Library</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Reusable origins, destinations, and freight for faster quote requests.
                </p>
            </div>

            <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                    onClick={() => setTab('locations')}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                        tab === 'locations' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <MapPin className="h-4 w-4" />
                    Locations ({locations.length})
                </button>
                <button
                    onClick={() => setTab('freight')}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                        tab === 'freight' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Package className="h-4 w-4" />
                    Freight ({freight.length})
                </button>
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading library…
                </div>
            ) : tab === 'locations' ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">Saved Locations</h2>
                        <button
                            onClick={() => setShowLocForm((s) => !s)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            {showLocForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {showLocForm ? 'Cancel' : 'Add location'}
                        </button>
                    </div>

                    {showLocForm && (
                        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                            <input className={input} placeholder="Label *" value={locForm.label} onChange={(e) => setLocForm({ ...locForm, label: e.target.value })} />
                            <select className={input} value={locForm.location_type} onChange={(e) => setLocForm({ ...locForm, location_type: e.target.value })}>
                                <option value="both">Origin or Destination</option>
                                <option value="origin">Origin only</option>
                                <option value="destination">Destination only</option>
                            </select>
                            <input className={input} placeholder="Contact name" value={locForm.contact_name} onChange={(e) => setLocForm({ ...locForm, contact_name: e.target.value })} />
                            <input className={input} placeholder="Phone" value={locForm.phone} onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })} />
                            <input className={`${input} lg:col-span-2`} placeholder="Street" value={locForm.street} onChange={(e) => setLocForm({ ...locForm, street: e.target.value })} />
                            <input className={input} placeholder="City" value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} />
                            <input className={input} placeholder="State" value={locForm.state} onChange={(e) => setLocForm({ ...locForm, state: e.target.value })} />
                            <input className={input} placeholder="Zip" value={locForm.zip} onChange={(e) => setLocForm({ ...locForm, zip: e.target.value })} />
                            <div className="lg:col-span-3">
                                <button onClick={addLocation} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save location
                                </button>
                            </div>
                        </div>
                    )}

                    {locations.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No saved locations yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {locations.map((loc) => (
                                <li key={loc.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                            <Building2 className="h-4 w-4 text-blue-600" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">{loc.label}</p>
                                            <p className="truncate text-xs text-slate-500">
                                                {[loc.street, loc.city, loc.state, loc.zip].filter(Boolean).join(', ') || '—'}
                                            </p>
                                            <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                                                {loc.location_type || 'both'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteItem('saved_locations', loc.id)}
                                        disabled={busyId === loc.id}
                                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                    >
                                        {busyId === loc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">Saved Freight</h2>
                        <button
                            onClick={() => setShowFreightForm((s) => !s)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            {showFreightForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {showFreightForm ? 'Cancel' : 'Add freight'}
                        </button>
                    </div>

                    {showFreightForm && (
                        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                            <input className={input} placeholder="Label *" value={freightForm.label} onChange={(e) => setFreightForm({ ...freightForm, label: e.target.value })} />
                            <input className={input} placeholder="Freight type" value={freightForm.freight_type} onChange={(e) => setFreightForm({ ...freightForm, freight_type: e.target.value })} />
                            <input className={input} placeholder="Commodity" value={freightForm.commodity} onChange={(e) => setFreightForm({ ...freightForm, commodity: e.target.value })} />
                            <input className={input} placeholder="Year" value={freightForm.year} onChange={(e) => setFreightForm({ ...freightForm, year: e.target.value })} />
                            <input className={input} placeholder="Make" value={freightForm.make} onChange={(e) => setFreightForm({ ...freightForm, make: e.target.value })} />
                            <input className={input} placeholder="Model" value={freightForm.model} onChange={(e) => setFreightForm({ ...freightForm, model: e.target.value })} />
                            <input className={input} placeholder="Length" value={freightForm.length} onChange={(e) => setFreightForm({ ...freightForm, length: e.target.value })} />
                            <input className={input} placeholder="Width" value={freightForm.width} onChange={(e) => setFreightForm({ ...freightForm, width: e.target.value })} />
                            <input className={input} placeholder="Height" value={freightForm.height} onChange={(e) => setFreightForm({ ...freightForm, height: e.target.value })} />
                            <input className={input} placeholder="Weight (lbs)" value={freightForm.weight} onChange={(e) => setFreightForm({ ...freightForm, weight: e.target.value })} />
                            <div className="lg:col-span-3">
                                <button onClick={addFreight} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save freight
                                </button>
                            </div>
                        </div>
                    )}

                    {freight.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No saved freight yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {freight.map((f) => (
                                <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
                                            <Package className="h-4 w-4 text-purple-600" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">{f.label}</p>
                                            <p className="truncate text-xs text-slate-500">
                                                {[f.freight_type, [f.length, f.width, f.height].filter(Boolean).join(' × '), f.weight && `${f.weight} lbs`]
                                                    .filter(Boolean)
                                                    .join(' • ') || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteItem('saved_freight', f.id)}
                                        disabled={busyId === f.id}
                                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                    >
                                        {busyId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default SavedLibrary;
