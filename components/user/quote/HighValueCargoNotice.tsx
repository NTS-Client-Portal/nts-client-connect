import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface HighValueCargoNoticeProps {
    goodsValue?: string | number | null;
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Dollar amount above which the coverage prompt appears. */
    threshold?: number;
    className?: string;
}

const parseValue = (value?: string | number | null): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n =
        typeof value === 'number'
            ? value
            : parseFloat(String(value).replace(/[$,\s]/g, ''));
    return Number.isNaN(n) ? null : n;
};

/**
 * When the shipper declares a high cargo value, prompt them to request extra
 * cargo coverage. Standard carrier cargo insurance is commonly capped
 * (~$100k), so high-value loads may need a trip rider. Surfacing this at
 * quote time lets the broker vet carrier limits up front.
 */
const HighValueCargoNotice: React.FC<HighValueCargoNoticeProps> = ({
    goodsValue,
    checked,
    onChange,
    threshold = 100000,
    className = '',
}) => {
    const value = parseValue(goodsValue);
    if (value === null || value < threshold) return null;

    const formatted = value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });

    return (
        <div
            className={`rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 ${className}`}
        >
            <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                        High-value cargo ({formatted})
                    </p>
                    <p className="mt-0.5 text-xs text-blue-800">
                        Standard carrier cargo coverage is often capped around $100k. For
                        loads above that, we can arrange additional coverage.
                    </p>
                    <label className="mt-2 flex cursor-pointer items-center gap-2">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-blue-900">
                            Request additional cargo coverage for this shipment
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default HighValueCargoNotice;
