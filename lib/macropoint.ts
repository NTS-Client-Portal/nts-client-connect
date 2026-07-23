/**
 * MacroPoint Lite integration helper (scaffold).
 *
 * MacroPoint Lite is XML-over-HTTP with Basic Auth. NTS (the broker) owns the
 * MacroPoint account, so ALL of this runs server-side only — the credentials
 * and MPID must never reach the browser.
 *
 * This module intentionally does NOT make any network calls on its own. It
 * only builds/parses XML and reads config. The API routes decide when (and
 * whether) to actually call MacroPoint. When the env vars are absent we run in
 * "scaffold mode": XML is still built and tracking rows are still written
 * locally, but no outbound request is made.
 *
 * Env vars (set in Netlify / .env.local — none are NEXT_PUBLIC):
 *   MACROPOINT_BASE_URL        default https://macropoint-lite.com/api/1.0
 *   MACROPOINT_USERNAME        Basic Auth user for outbound calls
 *   MACROPOINT_PASSWORD        Basic Auth pass for outbound calls
 *   MACROPOINT_MPID            NTS's MacroPoint ID (Requestor.MPID)
 *   MACROPOINT_WEBHOOK_USER    Basic Auth user MacroPoint must send to our webhook
 *   MACROPOINT_WEBHOOK_PASS    Basic Auth pass MacroPoint must send to our webhook
 */

export type TrackingNumberType = 'Mobile' | 'MacroPoint' | 'ShipmentID' | 'VehicleID';

export interface MacroPointConfig {
    baseUrl: string;
    username: string;
    password: string;
    mpid: string;
    /** True only when the outbound credentials + MPID are all present. */
    configured: boolean;
}

export function getMacroPointConfig(): MacroPointConfig {
    const baseUrl = process.env.MACROPOINT_BASE_URL || 'https://macropoint-lite.com/api/1.0';
    const username = process.env.MACROPOINT_USERNAME || '';
    const password = process.env.MACROPOINT_PASSWORD || '';
    const mpid = process.env.MACROPOINT_MPID || '';
    return {
        baseUrl,
        username,
        password,
        mpid,
        configured: Boolean(username && password && mpid),
    };
}

export function basicAuthHeader(username: string, password: string): string {
    return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

/** Escape a value for safe insertion into an XML text node. */
export function escapeXml(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const NS = "xmlns='http://macropoint-lite.com/xml/1.0'";

/**
 * Build the Tracking Assignment payload. This tells MacroPoint HOW to track
 * the load (driver mobile, MacroPoint app code, shipment id, or vehicle id).
 * Endpoint: POST {baseUrl}/order/trackingnumberassignment
 */
export function buildTrackingAssignmentXml(params: {
    numberType: TrackingNumberType;
    trackingNumber: string;
    mpid: string;
    loadId: string;
}): string {
    const { numberType, trackingNumber, mpid, loadId } = params;
    return `<TrackingNumberData ${NS}>
  <Number Type="${escapeXml(numberType)}">${escapeXml(trackingNumber)}</Number>
  <Requestor>
    <MPID>${escapeXml(mpid)}</MPID>
    <LoadID>${escapeXml(loadId)}</LoadID>
  </Requestor>
</TrackingNumberData>`;
}

/**
 * Build a Location Update payload. Not used in normal flow (MacroPoint pushes
 * locations to us), but handy for local testing / seeding via the webhook.
 * Endpoint: POST {baseUrl}/tms/data/location
 */
export function buildLocationUpdateXml(params: {
    loadId: string;
    mpid: string;
    latitude: number;
    longitude: number;
    createdDateTimeUtc: string; // ISO 8601 UTC, e.g. 2026-07-23T19:25Z
    uncertaintyMiles?: number;
}): string {
    const { loadId, mpid, latitude, longitude, createdDateTimeUtc, uncertaintyMiles } = params;
    return `<TMSLocationData ${NS}>
  <Sender>
    <LoadID>${escapeXml(loadId)}</LoadID>
  </Sender>
  <Requestor>
    <MPID>${escapeXml(mpid)}</MPID>
    <LoadID>${escapeXml(loadId)}</LoadID>
  </Requestor>
  <AllowAccessFrom>
    <MPID>${escapeXml(mpid)}</MPID>
  </AllowAccessFrom>
  <Location>
    <Coordinates>
      <Latitude>${escapeXml(latitude)}</Latitude>
      <Longitude>${escapeXml(longitude)}</Longitude>
    </Coordinates>
    ${uncertaintyMiles != null ? `<Uncertainty>${escapeXml(uncertaintyMiles)}</Uncertainty>` : ''}
    <CreatedDateTime>${escapeXml(createdDateTimeUtc)}</CreatedDateTime>
  </Location>
</TMSLocationData>`;
}

/**
 * Very small tag reader for the flat MacroPoint schema.
 *
 * NOTE: this is a scaffold-grade parser good enough for the known, namespaced
 * MacroPoint payloads. Before going live, swap this for `fast-xml-parser` (or
 * similar) to handle namespaces, attributes and edge cases robustly.
 */
function tag(xml: string, name: string): string | null {
    const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
    return m ? m[1].trim() : null;
}

function num(value: string | null): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export interface InboundLocation {
    loadId: string | null;
    latitude: number | null;
    longitude: number | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    stateProvince: string | null;
    postalCode: string | null;
    countryCode: string | null;
    uncertaintyMiles: number | null;
    createdDateTimeUtc: string | null;
}

/** Parse an inbound Location payload into a flat object (or null if not one). */
export function parseInboundLocation(xml: string): InboundLocation | null {
    if (!/TMSLocationData|<Location>/i.test(xml)) return null;
    // Sender.LoadID is how WE identify the load; fall back to Requestor.LoadID.
    const senderBlock = tag(xml, 'Sender');
    const loadId = (senderBlock && tag(senderBlock, 'LoadID')) || tag(xml, 'LoadID');
    return {
        loadId: loadId,
        latitude: num(tag(xml, 'Latitude')),
        longitude: num(tag(xml, 'Longitude')),
        addressLine1: tag(xml, 'Line1'),
        addressLine2: tag(xml, 'Line2'),
        city: tag(xml, 'City'),
        stateProvince: tag(xml, 'StateOrProvince'),
        postalCode: tag(xml, 'PostalCode'),
        countryCode: tag(xml, 'CountryCode'),
        uncertaintyMiles: num(tag(xml, 'Uncertainty')),
        createdDateTimeUtc: tag(xml, 'CreatedDateTime'),
    };
}

export interface InboundStopEvent {
    loadId: string | null;
    stopType: string | null;   // PickUp | DropOff
    eventName: string | null;  // Arrived | Departed
    stopName: string | null;
    completedDateTimeUtc: string | null;
    sequenceNumber: number | null;
    notes: string | null;
}

/** Parse an inbound Stop Event payload (or null if not one). */
export function parseInboundStopEvent(xml: string): InboundStopEvent | null {
    if (!/TMSStopEventData|<StopType>/i.test(xml)) return null;
    const senderBlock = tag(xml, 'Sender');
    const stopBlock = tag(xml, 'Stop');
    const eventBlock = tag(xml, 'Event');
    const loadId = (senderBlock && tag(senderBlock, 'LoadID')) || tag(xml, 'LoadID');
    return {
        loadId,
        stopType: stopBlock ? tag(stopBlock, 'StopType') : tag(xml, 'StopType'),
        eventName: eventBlock ? tag(eventBlock, 'Name') : tag(xml, 'Name'),
        stopName: stopBlock ? tag(stopBlock, 'Name') : null,
        completedDateTimeUtc: eventBlock ? tag(eventBlock, 'CompletedDateTime') : tag(xml, 'CompletedDateTime'),
        sequenceNumber: num(stopBlock ? tag(stopBlock, 'SequenceNumber') : null),
        notes: stopBlock ? tag(stopBlock, 'Notes') : null,
    };
}
