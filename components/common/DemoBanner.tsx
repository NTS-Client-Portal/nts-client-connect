import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useDemoMode } from '@/lib/demoMode';

/**
 * Slim banner shown across the app while in demo mode. Renders nothing when
 * demo mode is off, so it's safe to mount unconditionally in the layouts.
 */
const DemoBanner: React.FC = () => {
    const demo = useDemoMode();
    if (!demo) return null;

    return (
        <div className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-amber-950 shadow-sm sm:text-xs">
            <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Demo Environment — sample data for demonstration only. Not a live account.</span>
        </div>
    );
};

export default DemoBanner;
