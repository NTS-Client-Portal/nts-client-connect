# MacroPoint Tracking — Integration Plan & Scaffold

Status: **scaffold / non-live**. All the plumbing exists and works end-to-end
against our own database, but nothing calls MacroPoint yet. When the NTS
MacroPoint account + credentials are ready, flip the env vars and it goes live
with no structural changes.

---

## 1. The model — who talks to MacroPoint

MacroPoint Lite is **XML over HTTPS with Basic Auth**. NTS (the broker) owns the
MacroPoint account (`MPID` + credentials). Those secrets live **server-side
only** — the shipper's browser never touches MacroPoint.

Two directions of data:

```
Broker UI ──"Start Tracking"──▶ /api/tracking/assign ──▶ MacroPoint
                                                             │
MacroPoint ──Location + Stop Events──▶ /api/tracking/webhook ─┘
                                            │
                                            ▼
                                   Supabase tracking tables
                                            │
                        ┌───────────────────┴───────────────────┐
                        ▼                                        ▼
        Shipper order page (/user/orders/SP-###)        Broker order view
        live map + progress timeline
```

`LoadID` (MacroPoint's `Sender.LoadID`) = our `shippingquotes.id`. That's the
join key between our DB and MacroPoint. `SP-146` ↔ id `146` via
`lib/quoteUtils.ts`.

---

## 2. What was scaffolded

| Piece | File | Purpose |
| --- | --- | --- |
| DB migration | `migrations/008_macropoint_tracking.sql` | Tracking columns on `shippingquotes` + `tracking_locations` + `tracking_events` + RLS |
| Shared helper | `lib/macropoint.ts` | Config, Basic Auth, XML build/parse (no network calls) |
| Assign route | `pages/api/tracking/assign.ts` | Broker starts a tracking session (POST to MacroPoint + persist) |
| Webhook route | `pages/api/tracking/webhook.ts` | MacroPoint pushes location + stop events in |
| Shipper UI | `pages/user/orders/[orderId].tsx` | Live map + event-driven progress timeline |

Not yet built: the broker **"Start Tracking"** button (snippet in §7).

---

## 3. Environment variables

None are `NEXT_PUBLIC` (except the Maps key, which already exists). Set these in
`.env.local` and in Netlify:

```bash
# Outbound to MacroPoint (broker → MacroPoint)
MACROPOINT_BASE_URL=https://macropoint-lite.com/api/1.0
MACROPOINT_USERNAME=...
MACROPOINT_PASSWORD=...
MACROPOINT_MPID=...            # NTS's MacroPoint ID

# Inbound webhook auth (MacroPoint → us). Configure the same creds in MacroPoint.
MACROPOINT_WEBHOOK_USER=...
MACROPOINT_WEBHOOK_PASS=...

# Already present — reused for the live map embed
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

**Scaffold mode:** if `MACROPOINT_*` outbound vars are absent, `/api/tracking/assign`
skips the outbound call but still records the assignment locally. If the webhook
creds are absent, the webhook accepts unauthenticated requests (with a console
warning) — fine for local testing, **must be set before exposing publicly.**

---

## 4. Database (migration 008)

Run: apply `migrations/008_macropoint_tracking.sql` (same way as prior
migrations — see `run_status_migration.js` for the pattern).

- `shippingquotes.macropoint_load_id`, `tracking_number`, `tracking_number_type`
  (`Mobile|MacroPoint|ShipmentID|VehicleID`), `tracking_status`
  (`none|active|stopped|completed`)
- `tracking_locations` — one row per GPS fix (lat/lng, address, uncertainty,
  `created_at_utc`, `raw_payload`)
- `tracking_events` — stop events (`stop_type` PickUp/DropOff, `event_name`
  Arrived/Departed, `completed_at_utc`)

**RLS:** SELECT only, allowed for the order owner (shipper), any broker assigned
to the order's company (`company_sales_users`), and any `nts_users` row. All
writes go through the **service-role** key in the API routes, which bypasses RLS.

> After applying, regenerate `lib/database.types.ts` so the new tables/columns
> are typed. Until then, the routes/UI cast the new tables to `any` where needed.

---

## 5. API routes

### `POST /api/tracking/assign` (broker only)
```jsonc
// body
{ "quoteId": 146, "numberType": "Mobile", "trackingNumber": "5551234567" }
// headers: Authorization: Bearer <supabase access token>
```
- Verifies the caller is an `nts_users` row.
- Builds `TrackingNumberData` XML and (if configured) POSTs to
  `…/order/trackingnumberassignment`.
- Persists `tracking_status='active'` + the assignment on the order.
- Returns `{ ok, loadId, macropointCalled, mode: 'live' | 'scaffold' }`.

### `POST /api/tracking/webhook` (called by MacroPoint)
- Basic Auth via `MACROPOINT_WEBHOOK_USER/PASS`.
- Raw XML body (Next body parser disabled).
- Parses Location or Stop Event, maps `LoadID → quote_id`, inserts a row.
- On DropOff/Arrived, sets `tracking_status='completed'`.

> The inbound **callback** payload format should be confirmed against
> MacroPoint's spec. The parser in `lib/macropoint.ts` handles the documented
> TMS schema and is easy to adjust. Before go-live, replace the small regex
> tag-reader with `fast-xml-parser` for robustness.

### Netlify note
`netlify.toml` rewrites `/api/* → /.netlify/functions/:splat`. These routes work
locally (Pages Router API), but for **production** you must either add matching
Netlify functions or a rewrite exception for `/api/tracking/*`, otherwise they
404 in prod (same gotcha as the `notify-*` routes).

---

## 6. Shipper UI behavior (`/user/orders/SP-###`)

- Polls `tracking_locations` + `tracking_events` every 20s (RLS-scoped).
- **Map:** once a location row exists, renders a Google Maps embed centered on
  the latest fix, with "Near City, ST (±N mi)" and "Updated <time>". Until then,
  the dashed placeholder shows.
- **Timeline:** driven by stop events —
  - PickUp/Arrived → *Picked Up*
  - PickUp/Departed → *In Transit*
  - DropOff/Arrived → *Delivered*
  - falls back to the order `status` string when no events exist yet.

---

## 7. Remaining wiring — broker "Start Tracking" button

Drop this into the broker order view (e.g. within the `QuoteRequest` broker
flow or a dedicated order panel). It calls the assign route with the broker's
session token:

```tsx
const startTracking = async (quoteId: number, numberType: string, trackingNumber: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/tracking/assign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ quoteId, numberType, trackingNumber }),
    });
    return res.json(); // { ok, mode: 'live' | 'scaffold', ... }
};
```

UI: a small form with a `numberType` select (Mobile / VehicleID / MacroPoint /
ShipmentID) + a text input for the number, shown on active orders.

---

## 8. Demo without MacroPoint (seed a "live" location)

To make the map light up for a demo, insert a mock location for an order
(replace `146` and coords):

```sql
INSERT INTO tracking_locations
  (quote_id, latitude, longitude, city, state_province, uncertainty_miles, created_at_utc, source)
VALUES
  (146, 39.7392, -104.9903, 'Denver', 'CO', 3, now(), 'mock');
```

Then open `/user/orders/SP-146` — within 20s the map renders. Add a
`tracking_events` row to advance the timeline:

```sql
INSERT INTO tracking_events (quote_id, stop_type, event_name, completed_at_utc, source)
VALUES (146, 'PickUp', 'Departed', now(), 'mock');
```

Alternatively, POST a MacroPoint-shaped XML body to `/api/tracking/webhook`
locally (no auth needed in scaffold mode) using `buildLocationUpdateXml`.

---

## 9. Security checklist before go-live

- [ ] Set `MACROPOINT_WEBHOOK_USER/PASS`; confirm the webhook rejects
      unauthenticated calls (no more scaffold-mode bypass).
- [ ] Keep all `MACROPOINT_*` and `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- [ ] Confirm RLS: a shipper cannot read another company's `tracking_locations`
      by guessing `quote_id` (mirrors the IDOR concern on the `SP-###` URL).
- [ ] Replace the regex XML reader with `fast-xml-parser`.
- [ ] Add Netlify functions (or a rewrite exception) for `/api/tracking/*`.
- [ ] Regenerate `lib/database.types.ts` and remove the `any` casts.
- [ ] Consider Supabase Realtime on `tracking_locations` to replace polling.
```
