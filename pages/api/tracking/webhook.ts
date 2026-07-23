import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
    parseInboundLocation,
    parseInboundStopEvent,
    basicAuthHeader,
} from '@/lib/macropoint';

/**
 * POST /api/tracking/webhook  (called by MacroPoint)
 *
 * MacroPoint pushes Location Updates and Stop Events here as XML. We
 * authenticate the caller with Basic Auth (shared secret), parse the payload,
 * map LoadID -> shippingquotes.id, and upsert into tracking_locations /
 * tracking_events. The shipper order page reads those tables (via RLS) to draw
 * the live map + progress timeline.
 *
 * SECURITY:
 *  - Basic Auth on the way IN (MACROPOINT_WEBHOOK_USER / _PASS) so nobody can
 *    inject fake locations. Configure the same creds in MacroPoint's callback.
 *  - Writes use the service-role key (bypasses RLS) — never expose this route's
 *    key to the client.
 *
 * NOTE: the exact field paths of MacroPoint's *callback* payload should be
 * confirmed against their spec; the parser in lib/macropoint.ts handles the
 * documented TMS schema and is easy to adjust.
 */

// MacroPoint sends XML, not JSON — disable Next's body parser and read raw.
export const config = {
    api: {
        bodyParser: false,
    },
};

function readRawBody(req: NextApiRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function isAuthorized(req: NextApiRequest): boolean {
    const user = process.env.MACROPOINT_WEBHOOK_USER;
    const pass = process.env.MACROPOINT_WEBHOOK_PASS;
    // If no webhook creds are configured we are in scaffold mode — allow, but
    // warn loudly. Set these before exposing the endpoint publicly.
    if (!user || !pass) {
        console.warn('tracking/webhook: no MACROPOINT_WEBHOOK_USER/PASS set — accepting unauthenticated (scaffold mode)');
        return true;
    }
    const expected = basicAuthHeader(user, pass);
    const provided = req.headers.authorization || '';
    return provided === expected;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isAuthorized(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error('tracking/webhook: Supabase server credentials missing');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    const xml = await readRawBody(req);
    if (!xml) {
        return res.status(400).json({ error: 'Empty body' });
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);
    // New tracking tables aren't in the generated Database type yet.
    const db = supabase as unknown as {
        from: (t: string) => any;
    };

    // --- Location update ----------------------------------------------------
    const loc = parseInboundLocation(xml);
    if (loc) {
        const quoteId = Number(loc.loadId);
        if (!Number.isFinite(quoteId) || quoteId <= 0) {
            return res.status(400).json({ error: 'Location payload missing a valid LoadID' });
        }
        const { error } = await db.from('tracking_locations').insert({
            quote_id: quoteId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            address_line1: loc.addressLine1,
            address_line2: loc.addressLine2,
            city: loc.city,
            state_province: loc.stateProvince,
            postal_code: loc.postalCode,
            country_code: loc.countryCode,
            uncertainty_miles: loc.uncertaintyMiles,
            created_at_utc: loc.createdDateTimeUtc,
            source: 'macropoint',
            raw_payload: xml,
        });
        if (error) {
            console.error('tracking/webhook: failed to insert location', error.message);
            return res.status(500).json({ error: 'Failed to store location' });
        }
        return res.status(201).json({ ok: true, type: 'location', quoteId });
    }

    // --- Stop event ---------------------------------------------------------
    const evt = parseInboundStopEvent(xml);
    if (evt) {
        const quoteId = Number(evt.loadId);
        if (!Number.isFinite(quoteId) || quoteId <= 0) {
            return res.status(400).json({ error: 'Stop event payload missing a valid LoadID' });
        }
        const { error } = await db.from('tracking_events').insert({
            quote_id: quoteId,
            stop_type: evt.stopType,
            event_name: evt.eventName,
            stop_name: evt.stopName,
            completed_at_utc: evt.completedDateTimeUtc,
            sequence_number: evt.sequenceNumber,
            notes: evt.notes,
            source: 'macropoint',
            raw_payload: xml,
        });
        if (error) {
            console.error('tracking/webhook: failed to insert event', error.message);
            return res.status(500).json({ error: 'Failed to store stop event' });
        }

        // Advance the order's tracking_status on delivery for convenience.
        if ((evt.stopType || '').toLowerCase().includes('drop') &&
            (evt.eventName || '').toLowerCase().includes('arriv')) {
            await db.from('shippingquotes')
                .update({ tracking_status: 'completed' })
                .eq('id', quoteId);
        }

        return res.status(201).json({ ok: true, type: 'event', quoteId });
    }

    return res.status(400).json({ error: 'Unrecognized MacroPoint payload' });
}
