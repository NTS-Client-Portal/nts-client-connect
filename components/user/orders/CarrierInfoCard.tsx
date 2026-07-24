import React from 'react';
import { Truck, Phone, User, Hash, ShieldCheck, BadgeCheck } from 'lucide-react';

export interface CarrierInfo {
    carrier_name?: string | null;
    carrier_mc_number?: string | null;
    carrier_dot_number?: string | null;
    carrier_phone?: string | null;
    carrier_contact?: string | null;
    driver_name?: string | null;
    driver_phone?: string | null;
    truck_number?: string | null;
    trailer_number?: string | null;
    carrier_visible_to_shipper?: boolean | null;
}

interface CarrierInfoCardProps {
    order: CarrierInfo;
    className?: string;
}

const Field: React.FC<{ icon: React.ElementType; label: string; value?: React.ReactNode; href?: string }> = ({
    icon: Icon,
    label,
    value,
    href,
}) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <div>
                <p className="text-xs font-medium text-slate-400">{label}</p>
                {href ? (
                    <a href={href} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {value}
                    </a>
                ) : (
                    <p className="text-sm text-slate-800">{value}</p>
                )}
            </div>
        </div>
    );
};

/**
 * Broker-optional carrier card. Renders on the shipper order page only once the
 * broker has (a) attached a carrier AND (b) flipped carrier_visible_to_shipper.
 * Until then the shipper sees nothing here — assignment stays internal.
 */
const CarrierInfoCard: React.FC<CarrierInfoCardProps> = ({ order, className = '' }) => {
    const visible = !!order.carrier_visible_to_shipper && !!order.carrier_name;
    if (!visible) return null;

    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-slate-900">Carrier Information</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Assigned
                </span>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
                <Field icon={Truck} label="Carrier" value={order.carrier_name} />
                <Field icon={User} label="Dispatch Contact" value={order.carrier_contact} />
                <Field icon={ShieldCheck} label="MC Number" value={order.carrier_mc_number && `MC-${order.carrier_mc_number}`} />
                <Field icon={ShieldCheck} label="USDOT" value={order.carrier_dot_number} />
                <Field
                    icon={Phone}
                    label="Carrier Phone"
                    value={order.carrier_phone}
                    href={order.carrier_phone ? `tel:${order.carrier_phone}` : undefined}
                />
                <Field icon={User} label="Driver" value={order.driver_name} />
                <Field
                    icon={Phone}
                    label="Driver Phone"
                    value={order.driver_phone}
                    href={order.driver_phone ? `tel:${order.driver_phone}` : undefined}
                />
                <Field icon={Hash} label="Truck #" value={order.truck_number} />
                <Field icon={Hash} label="Trailer #" value={order.trailer_number} />
            </div>
        </div>
    );
};

export default CarrierInfoCard;
