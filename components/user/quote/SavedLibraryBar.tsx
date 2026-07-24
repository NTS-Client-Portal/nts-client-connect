import React, { useCallback, useEffect, useState } from 'react';
import { Session, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { BookMarked, Package, MapPin, Plus, Loader2 } from 'lucide-react';

type SavedFreightRow = Database['public']['Tables']['saved_freight']['Row'];
type SavedLocationRow = Database['public']['Tables']['saved_locations']['Row'];

export interface CurrentFreight {
    freight_type?: string;
    year?: string;
    make?: string;
    model?: string;
    commodity?: string;
    length?: string;
    length_unit?: string;
    width?: string;
    width_unit?: string;
    height?: string;
    height_unit?: string;
    weight?: string;
    weight_unit?: string;
    operational_condition?: boolean | null;
}

export interface CurrentLocation {
    contact_name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
}

interface SavedLibraryBarProps {
    session: Session;
    companyId: string;
    selectedFreightType: string;
    currentFreight: CurrentFreight;
    currentOrigin: CurrentLocation;
    currentDestination: CurrentLocation;
    onApplyFreight: (row: SavedFreightRow) => void;
    onApplyLocation: (target: 'origin' | 'destination', row: SavedLocationRow) => void;
}

/**
 * Idea 5 — Saved Freight + Location address book.
 * Lets a repeat shipper re-submit a known machine or a known yard in one click,
 * and save the current freight/route back to their company library for reuse.
 * Backed by the saved_freight / saved_locations tables (migration 010).
 */
const SavedLibraryBar: React.FC<SavedLibraryBarProps> = ({
    session,
    companyId,
    selectedFreightType,
    currentFreight,
    currentOrigin,
    currentDestination,
    onApplyFreight,
    onApplyLocation,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [freight, setFreight] = useState<SavedFreightRow[]>([]);
    const [locations, setLocations] = useState<SavedLocationRow[]>([]);
    const [savingFreight, setSavingFreight] = useState(false);
    const [savingOrigin, setSavingOrigin] = useState(false);
    const [savingDestination, setSavingDestination] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        const [{ data: fData }, { data: lData }] = await Promise.all([
            supabase
                .from('saved_freight')
                .select('*')
                .order('created_at', { ascending: false }),
            supabase
                .from('saved_locations')
                .select('*')
                .order('created_at', { ascending: false }),
        ]);
        setFreight((fData as SavedFreightRow[]) || []);
        setLocations((lData as SavedLocationRow[]) || []);
    }, [supabase]);

    useEffect(() => {
        load();
    }, [load]);

    const handlePickFreight = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const row = freight.find((f) => String(f.id) === e.target.value);
        if (row) onApplyFreight(row);
    };

    const handlePickLocation = (
        target: 'origin' | 'destination',
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const row = locations.find((l) => String(l.id) === e.target.value);
        if (row) onApplyLocation(target, row);
    };

    const saveFreight = async () => {
        if (!selectedFreightType && !currentFreight.make) {
            setError('Add freight details before saving.');
            return;
        }
        const suggested = [currentFreight.year, currentFreight.make, currentFreight.model]
            .filter(Boolean)
            .join(' ')
            .trim();
        const label = window.prompt('Name this saved freight:', suggested || 'My equipment');
        if (!label) return;
        setSavingFreight(true);
        setError('');
        const { error: insertError } = await supabase.from('saved_freight').insert({
            user_id: session.user.id,
            company_id: companyId,
            label,
            freight_type: selectedFreightType || null,
            year: currentFreight.year || null,
            make: currentFreight.make || null,
            model: currentFreight.model || null,
            commodity: currentFreight.commodity || null,
            length: currentFreight.length || null,
            length_unit: currentFreight.length_unit || null,
            width: currentFreight.width || null,
            width_unit: currentFreight.width_unit || null,
            height: currentFreight.height || null,
            height_unit: currentFreight.height_unit || null,
            weight: currentFreight.weight || null,
            weight_unit: currentFreight.weight_unit || null,
            operational_condition: currentFreight.operational_condition ?? null,
        });
        setSavingFreight(false);
        if (insertError) {
            setError('Could not save freight.');
        } else {
            await load();
        }
    };

    const saveLocation = async (target: 'origin' | 'destination') => {
        const loc = target === 'origin' ? currentOrigin : currentDestination;
        if (!loc.city && !loc.zip) {
            setError(`Enter an ${target} before saving.`);
            return;
        }
        const suggested = [loc.city, loc.state].filter(Boolean).join(', ');
        const label = window.prompt(
            `Name this saved ${target}:`,
            suggested || (target === 'origin' ? 'Pickup yard' : 'Delivery site'),
        );
        if (!label) return;
        const setBusy = target === 'origin' ? setSavingOrigin : setSavingDestination;
        setBusy(true);
        setError('');
        const { error: insertError } = await supabase.from('saved_locations').insert({
            user_id: session.user.id,
            company_id: companyId,
            label,
            location_type: target,
            contact_name: loc.contact_name || null,
            phone: loc.phone || null,
            street: loc.street || null,
            city: loc.city || null,
            state: loc.state || null,
            zip: loc.zip || null,
        });
        setBusy(false);
        if (insertError) {
            setError(`Could not save ${target}.`);
        } else {
            await load();
        }
    };

    const locationOptions = (target: 'origin' | 'destination') =>
        locations.filter(
            (l) => !l.location_type || l.location_type === 'both' || l.location_type === target,
        );

    return (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <div className="mb-2 flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-900">Your Saved Library</h4>
                <span className="text-xs text-gray-500">— reuse a machine or a location in one click</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* Saved freight */}
                <div>
                    <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Package className="h-3.5 w-3.5 text-orange-500" /> Saved Freight
                    </label>
                    <select
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handlePickFreight}
                        value=""
                        disabled={freight.length === 0}
                    >
                        <option value="">
                            {freight.length ? 'Select saved freight…' : 'No saved freight yet'}
                        </option>
                        {freight.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={saveFreight}
                        disabled={savingFreight}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    >
                        {savingFreight ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Save current freight
                    </button>
                </div>

                {/* Saved origin */}
                <div>
                    <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-700">
                        <MapPin className="h-3.5 w-3.5 text-green-600" /> Saved Origin
                    </label>
                    <select
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handlePickLocation('origin', e)}
                        value=""
                        disabled={locationOptions('origin').length === 0}
                    >
                        <option value="">
                            {locationOptions('origin').length ? 'Select saved origin…' : 'No saved origins yet'}
                        </option>
                        {locationOptions('origin').map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => saveLocation('origin')}
                        disabled={savingOrigin}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    >
                        {savingOrigin ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Save current origin
                    </button>
                </div>

                {/* Saved destination */}
                <div>
                    <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-700">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" /> Saved Destination
                    </label>
                    <select
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handlePickLocation('destination', e)}
                        value=""
                        disabled={locationOptions('destination').length === 0}
                    >
                        <option value="">
                            {locationOptions('destination').length
                                ? 'Select saved destination…'
                                : 'No saved destinations yet'}
                        </option>
                        {locationOptions('destination').map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => saveLocation('destination')}
                        disabled={savingDestination}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    >
                        {savingDestination ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Save current destination
                    </button>
                </div>
            </div>

            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
};

export default SavedLibraryBar;
