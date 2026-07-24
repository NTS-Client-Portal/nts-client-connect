#!/usr/bin/env node
/**
 * NTS Carrier MCP server
 * ----------------------
 * Broker-side tooling that (1) looks up a carrier in the FMCSA QCMobile/SAFER
 * dataset by MC (docket) or USDOT number and (2) attaches the verified carrier +
 * driver details to an order in Supabase, optionally revealing them to the
 * shipper.
 *
 * This is the data-source half of the carrier feature: the shipper portal only
 * RENDERS carrier_* columns on shippingquotes. This server POPULATES them from an
 * authoritative source so what the shipper sees is FMCSA-verified, not typed by
 * hand — and the broker gets authority/insurance vetting as a side effect.
 *
 * Transport: stdio. Register in an MCP client (e.g. Claude Desktop, VS Code) as:
 *   { "command": "node", "args": ["/abs/path/mcp/carrier-lookup/server.mjs"] }
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const FMCSA_WEBKEY = process.env.FMCSA_WEBKEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FMCSA_BASE = 'https://mobile.fmcsa.dot.gov/qc/services/carriers';

/** Lazily created so the server can still boot for lookups even if Supabase env is absent. */
function getSupabase() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the MCP server environment.'
        );
    }
    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

// ---------------------------------------------------------------------------
// FMCSA helpers
// ---------------------------------------------------------------------------

/** Map a raw FMCSA carrier record onto our shippingquotes carrier_* columns. */
function normalizeCarrier(raw) {
    if (!raw) return null;
    const authority =
        raw.allowedToOperate === 'Y'
            ? 'Active'
            : raw.allowedToOperate === 'N'
              ? 'Not authorized'
              : 'Unknown';
    return {
        // Columns that map directly onto shippingquotes:
        carrier_name: raw.legalName || raw.dbaName || null,
        carrier_dot_number: raw.dotNumber != null ? String(raw.dotNumber) : null,
        carrier_phone: raw.telephone || raw.phone || null,
        // Context returned to the broker for a go/no-go decision (not all stored):
        _meta: {
            dbaName: raw.dbaName || null,
            authorityStatus: authority,
            statusCode: raw.statusCode || null,
            safetyRating: raw.safetyRating || 'Not rated',
            totalPowerUnits: raw.totalPowerUnits ?? null,
            totalDrivers: raw.totalDrivers ?? null,
            physicalAddress: [raw.phyStreet, raw.phyCity, raw.phyState, raw.phyZipcode]
                .filter(Boolean)
                .join(', '),
            outOfService: raw.oosDate ? `Out of service since ${raw.oosDate}` : 'No OOS on file',
        },
    };
}

async function fmcsaFetch(path) {
    if (!FMCSA_WEBKEY) {
        throw new Error(
            'FMCSA_WEBKEY is not set. Register a free key at https://mobile.fmcsa.dot.gov/QCDevsite/docs/getStarted and add it to the MCP server environment.'
        );
    }
    const url = `${FMCSA_BASE}${path}${path.includes('?') ? '&' : '?'}webKey=${FMCSA_WEBKEY}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        throw new Error(`FMCSA request failed (${res.status} ${res.statusText}).`);
    }
    const json = await res.json();
    // QCMobile wraps results in { content: [...] } (array for docket, object for DOT).
    const content = json?.content;
    if (!content) return null;
    if (Array.isArray(content)) {
        return content[0]?.carrier ?? null;
    }
    return content.carrier ?? content ?? null;
}

// ---------------------------------------------------------------------------
// Server + tools
// ---------------------------------------------------------------------------
const server = new McpServer({ name: 'nts-carrier-mcp', version: '0.1.0' });

server.registerTool(
    'lookup_carrier_by_mc',
    {
        title: 'Look up carrier by MC number',
        description:
            'Look up a motor carrier in the FMCSA QCMobile/SAFER dataset by its MC (docket) number. Returns the legal name, USDOT, phone, operating authority status, safety rating and fleet size so a broker can vet the carrier before assigning it to a load.',
        inputSchema: {
            mc_number: z
                .string()
                .describe('MC / docket number, digits only (e.g. "884213" — omit the "MC-" prefix).'),
        },
    },
    async ({ mc_number }) => {
        const docket = String(mc_number).replace(/\D/g, '');
        const raw = await fmcsaFetch(`/docket-number/${docket}`);
        if (!raw) {
            return {
                content: [{ type: 'text', text: `No FMCSA carrier found for MC-${docket}.` }],
                isError: true,
            };
        }
        const norm = normalizeCarrier(raw);
        return {
            content: [{ type: 'text', text: JSON.stringify({ mc_number: docket, ...norm }, null, 2) }],
        };
    }
);

server.registerTool(
    'lookup_carrier_by_dot',
    {
        title: 'Look up carrier by USDOT number',
        description:
            'Look up a motor carrier in the FMCSA QCMobile/SAFER dataset by its USDOT number. Same vetting fields as the MC lookup.',
        inputSchema: {
            dot_number: z.string().describe('USDOT number, digits only.'),
        },
    },
    async ({ dot_number }) => {
        const dot = String(dot_number).replace(/\D/g, '');
        const raw = await fmcsaFetch(`/${dot}`);
        if (!raw) {
            return {
                content: [{ type: 'text', text: `No FMCSA carrier found for USDOT ${dot}.` }],
                isError: true,
            };
        }
        const norm = normalizeCarrier(raw);
        return {
            content: [{ type: 'text', text: JSON.stringify(norm, null, 2) }],
        };
    }
);

server.registerTool(
    'attach_carrier_to_order',
    {
        title: 'Attach carrier to an order',
        description:
            'Write carrier + driver details onto a shippingquotes order. Any field left undefined is not changed. Set make_visible_to_shipper=true to reveal the carrier card on the shipper order page (defaults to false so the assignment stays internal until the broker is ready).',
        inputSchema: {
            order_id: z.number().int().describe('shippingquotes.id of the order.'),
            carrier_name: z.string().optional(),
            carrier_mc_number: z.string().optional(),
            carrier_dot_number: z.string().optional(),
            carrier_phone: z.string().optional(),
            carrier_contact: z.string().optional().describe('Dispatch contact name/desk.'),
            driver_name: z.string().optional(),
            driver_phone: z.string().optional(),
            truck_number: z.string().optional(),
            trailer_number: z.string().optional(),
            make_visible_to_shipper: z
                .boolean()
                .optional()
                .describe('Reveal the carrier card to the shipper. Default false.'),
        },
    },
    async (args) => {
        const supabase = getSupabase();
        const { order_id, make_visible_to_shipper, ...fields } = args;

        // Only include fields that were actually provided.
        const update = {};
        for (const [k, v] of Object.entries(fields)) {
            if (v !== undefined) update[k] = v;
        }
        if (make_visible_to_shipper !== undefined) {
            update.carrier_visible_to_shipper = make_visible_to_shipper;
        }
        update.carrier_dispatched_at = new Date().toISOString();

        if (Object.keys(update).length === 0) {
            return {
                content: [{ type: 'text', text: 'Nothing to update — no carrier fields provided.' }],
                isError: true,
            };
        }

        const { data, error } = await supabase
            .from('shippingquotes')
            .update(update)
            .eq('id', order_id)
            .select('id, carrier_name, carrier_mc_number, carrier_visible_to_shipper')
            .maybeSingle();

        if (error) {
            return { content: [{ type: 'text', text: `Update failed: ${error.message}` }], isError: true };
        }
        if (!data) {
            return {
                content: [{ type: 'text', text: `No order found with id ${order_id}.` }],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Carrier attached to order ${data.id}.\n${JSON.stringify(data, null, 2)}`,
                },
            ],
        };
    }
);

server.registerTool(
    'set_carrier_visibility',
    {
        title: 'Show/hide carrier on shipper order page',
        description:
            'Toggle whether the shipper sees the carrier card for an order, without changing the carrier data.',
        inputSchema: {
            order_id: z.number().int(),
            visible: z.boolean(),
        },
    },
    async ({ order_id, visible }) => {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('shippingquotes')
            .update({ carrier_visible_to_shipper: visible })
            .eq('id', order_id)
            .select('id, carrier_visible_to_shipper')
            .maybeSingle();
        if (error) {
            return { content: [{ type: 'text', text: `Update failed: ${error.message}` }], isError: true };
        }
        if (!data) {
            return {
                content: [{ type: 'text', text: `No order found with id ${order_id}.` }],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Order ${data.id} carrier is now ${data.carrier_visible_to_shipper ? 'VISIBLE' : 'HIDDEN'} to the shipper.`,
                },
            ],
        };
    }
);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stderr is safe for logs on stdio transport (stdout is the protocol channel).
    console.error('nts-carrier-mcp ready (stdio).');
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
