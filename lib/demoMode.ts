import { useEffect, useState } from 'react';

/**
 * Demo mode detection.
 *
 * The app switches into "demo" presentation when ANY of these are true:
 *   1. NEXT_PUBLIC_DEMO_MODE === 'true'  (set on the demo deploy)
 *   2. the hostname contains "-demo" or starts with "demo."  (e.g. app-demo.netlify.app)
 *   3. the URL has a ?demo query flag
 *
 * Demo mode is purely presentational here (banner, sample data). It does NOT
 * disable emails or external calls — keep that in mind for the demo deploy.
 */

export const DEMO_MODE_ENV = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function detectDemoFromUrl(): boolean {
    if (typeof window === 'undefined') return false;
    const { hostname, search } = window.location;
    if (/(^|\.)demo\.|-demo/i.test(hostname)) return true;
    const params = new URLSearchParams(search);
    return params.has('demo') && params.get('demo') !== '0';
}

/** Synchronous check — safe on server (env only) and client (env + URL). */
export function isDemoMode(): boolean {
    return DEMO_MODE_ENV || detectDemoFromUrl();
}

/**
 * Hook form. Starts from the env value (deterministic for SSR) then augments
 * with the URL check after mount to avoid hydration mismatches.
 */
export function useDemoMode(): boolean {
    const [demo, setDemo] = useState<boolean>(DEMO_MODE_ENV);
    useEffect(() => {
        setDemo(DEMO_MODE_ENV || detectDemoFromUrl());
    }, []);
    return demo;
}
