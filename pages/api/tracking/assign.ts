import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
    getMacroPointConfig,
    basicAuthHeader,
    buildTrackingAssignmentXml,
    TrackingNumberType,
} from '@/lib/macropoint';

/**
 * POST /api/tracking/assign  (broker-triggered)
 *
 * Body: { quoteId: number, numberType: 'Mobile'|'MacroPoint'|'ShipmentID'|'VehicleID', trackingNumber: string }
 *
 * Starts a MacroPoint tracking session for an order by assigning a tracking
 * method (driver mobile, MacroPoint app code, shipment id, or vehicle id).
 *
 * SCAFFOLD BEHAVIOR: if MacroPoint credentials are not configured, we skip the
 * outbound call but STILL record the assignment locally so the UI reflects
 * "tracking active". This lets the feature be demoed/wired end-to-end before
 * the real MacroPoint account exists.
 *
 * Only NTS users (brokers) may call this. We verify the caller's bearer token
 * against nts_users before doing anything.
 */

const VALID_TYPES: TrackingNumberType[] = ['Mobile', 'MacroPoint', 'ShipmentID', 'VehicleID'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error('tracking/assign: Supabase server credentials missing');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    // --- Validate input -----------------------------------------------------
    const quoteId = Number(req.body?.quoteId);
    const numberType = req.body?.numberType as TrackingNumberType;
    const trackingNumber = String(req.body?.trackingNumber || '').trim();

    if (!Number.isFinite(quoteId) || quoteId <= 0) {
        return res.status(400).json({ error: 'quoteId (positive number) is required' });
    }
    if (!VALID_TYPES.includes(numberType)) {
        return res.status(400).json({ error: `numberType must be one of ${VALID_TYPES.join(', ')}` });
    }
    if (!trackingNumber) {
        return res.status(400).json({ error: 'trackingNumber is required' });
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

    // --- AuthZ: caller must be an NTS user (broker) -------------------------
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) {
        return res.status(401).json({ error: 'Missing bearer token' });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
        return res.status(401).json({ error: 'Invalid session' });
    }
    const { data: broker } = await supabase
        .from('nts_users')
        .select('id')
        .eq('id', userData.user.id)
        .maybeSingle();
    if (!broker) {
        return res.status(403).json({ error: 'Only NTS users can start tracking' });
    }

    // --- Look up the order --------------------------------------------------
    const { data: quote, error: quoteErr } = await supabase
        .from('shippingquotes')
        .select('id')
        .eq('id', quoteId)
        .maybeSingle();
    if (quoteErr || !quote) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const loadId = String(quote.id); // Sender.LoadID = our order id
    const config = getMacroPointConfig();

    // --- Call MacroPoint (only when configured) ----------------------------
    let macropointCalled = false;
    if (config.configured) {
        const xml = buildTrackingAssignmentXml({
            numberType,
            trackingNumber,
            mpid: config.mpid,
            loadId,
        });
        try {
            const mpRes = await fetch(`${config.baseUrl}/order/trackingnumberassignment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: basicAuthHeader(config.username, config.password),
                },
                body: xml,
            });
            macropointCalled = true;
            if (!mpRes.ok) {
                const text = await mpRes.text();
                console.error('tracking/assign: MacroPoint rejected assignment', mpRes.status, text);
                return res.status(502).json({ error: 'MacroPoint rejected the assignment', detail: text });
            }
        } catch (err) {
            console.error('tracking/assign: MacroPoint request failed', err);
            return res.status(502).json({ error: 'Could not reach MacroPoint' });
        }
    }

    // --- Persist the assignment locally ------------------------------------
    const { error: updateErr } = await supabase
        .from('shippingquotes')
        // Columns added in migration 008; cast until database.types is regenerated.
        .update({
            macropoint_load_id: loadId,
            tracking_number: trackingNumber,
            tracking_number_type: numberType,
            tracking_status: 'active',
        } as never)
        .eq('id', quoteId);

    if (updateErr) {
        console.error('tracking/assign: failed to persist assignment', updateErr.message);
        return res.status(500).json({ error: 'Failed to save tracking assignment' });
    }

    return res.status(200).json({
        ok: true,
        loadId,
        macropointCalled,
        mode: config.configured ? 'live' : 'scaffold',
    });
}
