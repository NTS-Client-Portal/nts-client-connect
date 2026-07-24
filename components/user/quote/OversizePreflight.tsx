import React from 'react';
import { AlertTriangle, ShieldCheck, Ruler } from 'lucide-react';

interface OversizePreflightProps {
    length?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
    weight?: string | number | null;
    lengthUnit?: string | null;
    widthUnit?: string | null;
    heightUnit?: string | null;
    weightUnit?: string | null;
    className?: string;
}

// Legal (non-permit) maxima for a standard load, in inches / pounds.
// Anything above these typically requires an oversize/overweight permit and,
// depending on the state and dimension, pilot cars or escorts.
const MAX_WIDTH_IN = 102; // 8'6"
const MAX_HEIGHT_IN = 162; // 13'6"
const MAX_LENGTH_IN = 636; // 53'
const MAX_WEIGHT_LB = 80000;

const toInches = (value?: string | number | null, unit?: string | null): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    if (Number.isNaN(n)) return null;
    const u = (unit || 'ft').toLowerCase();
    if (u === 'in') return n;
    if (u === 'm') return n * 39.3701;
    return n * 12; // default feet
};

const toPounds = (value?: string | number | null, unit?: string | null): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    if (Number.isNaN(n)) return null;
    const u = (unit || 'lbs').toLowerCase();
    if (u === 'tons') return n * 2000;
    if (u === 'kg') return n * 2.20462;
    return n; // default lbs
};

interface Trigger {
    label: string;
    detail: string;
}

/**
 * Reads the freight dimensions already captured on the quote form and warns the
 * shipper — before they submit — if the load trips overwidth / overheight /
 * overlength / overweight thresholds (permits & escorts likely). Pure client-
 * side computation, no data is written.
 */
const OversizePreflight: React.FC<OversizePreflightProps> = ({
    length,
    width,
    height,
    weight,
    lengthUnit,
    widthUnit,
    heightUnit,
    weightUnit,
    className = '',
}) => {
    const widthIn = toInches(width, widthUnit);
    const heightIn = toInches(height, heightUnit);
    const lengthIn = toInches(length, lengthUnit);
    const weightLb = toPounds(weight, weightUnit);

    const hasAnyDimension =
        widthIn !== null || heightIn !== null || lengthIn !== null || weightLb !== null;
    if (!hasAnyDimension) return null;

    const triggers: Trigger[] = [];
    if (widthIn !== null && widthIn > MAX_WIDTH_IN) {
        triggers.push({ label: 'Overwidth', detail: `> 8'6" (102")` });
    }
    if (heightIn !== null && heightIn > MAX_HEIGHT_IN) {
        triggers.push({ label: 'Overheight', detail: `> 13'6" (162")` });
    }
    if (lengthIn !== null && lengthIn > MAX_LENGTH_IN) {
        triggers.push({ label: 'Overlength', detail: `> 53'` });
    }
    if (weightLb !== null && weightLb > MAX_WEIGHT_LB) {
        triggers.push({ label: 'Overweight', detail: '> 80,000 lb' });
    }

    if (triggers.length === 0) {
        return (
            <div
                className={`flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 ${className}`}
            >
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                    <p className="text-sm font-semibold text-green-800">Within standard limits</p>
                    <p className="text-xs text-green-700">
                        These dimensions look like a legal load — no oversize permit expected.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 ${className}`}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                        Oversize load — permits likely required
                    </p>
                    <p className="mt-0.5 text-xs text-amber-800">
                        Based on your dimensions, this load exceeds standard limits. Permits
                        (and possibly pilot cars/escorts) may apply. Your broker will confirm
                        exact requirements and pass-through costs.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {triggers.map((t) => (
                            <span
                                key={t.label}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800"
                                title={t.detail}
                            >
                                <Ruler className="h-3 w-3" />
                                {t.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OversizePreflight;
