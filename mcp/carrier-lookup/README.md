# NTS Carrier MCP server

Broker-side [Model Context Protocol](https://modelcontextprotocol.io) server that
turns "assign a carrier to this load" into an FMCSA-verified, one-sentence action.

It is the **data-source half** of the carrier feature. The shipper portal only
_renders_ the `carrier_*` columns on `shippingquotes`
([`CarrierInfoCard`](../../components/user/orders/CarrierInfoCard.tsx)). This server
_populates_ those columns from the authoritative FMCSA QCMobile/SAFER dataset, so
what the shipper sees is verified — and the broker gets authority/insurance vetting
for free.

```
Broker/agent ──▶ lookup_carrier_by_mc ──▶ FMCSA SAFER (legal name, USDOT, authority, safety rating)
             └─▶ attach_carrier_to_order ──▶ Supabase shippingquotes.carrier_* (+ visibility flag)
                                                    │
                                          Shipper order page renders CarrierInfoCard
```

## Tools

| Tool | Purpose |
|------|---------|
| `lookup_carrier_by_mc` | FMCSA lookup by MC/docket number — returns name, USDOT, phone, operating authority, safety rating, fleet size. |
| `lookup_carrier_by_dot` | Same, by USDOT number. |
| `attach_carrier_to_order` | Write carrier + driver details onto an order; optionally reveal to the shipper. |
| `set_carrier_visibility` | Show/hide the carrier card for an order without changing the data. |

## Setup

```bash
cd mcp/carrier-lookup
npm install
cp .env.example .env   # then fill in the three values
```

- `FMCSA_WEBKEY` — free key from <https://mobile.fmcsa.dot.gov/QCDevsite/docs/getStarted>.
  Without it, lookups return an actionable error but manual attach still works.
- `NEXT_PUBLIC_SUPABASE_URL` — same project the portal uses.
- `SUPABASE_SERVICE_ROLE_KEY` — required to write `carrier_*` and flip
  `carrier_visible_to_shipper` (bypasses RLS). **Server-side only — never ship this
  to the browser.**

> Requires migration `013_carrier_details.sql` to have been run against the DB.

## Run / register

Try it locally with the inspector:

```bash
npm run inspect
```

Register in an MCP client (VS Code `mcp.json`, Claude Desktop, etc.):

```jsonc
{
  "servers": {
    "nts-carrier": {
      "command": "node",
      "args": ["/home/bender/nts-client-connect/mcp/carrier-lookup/server.mjs"]
    }
  }
}
```

## Typical broker flow

> "Assign MC-884213 to order 146 and show it to the customer."

1. `lookup_carrier_by_mc { mc_number: "884213" }` → verify authority is Active / safety rating acceptable.
2. `attach_carrier_to_order { order_id: 146, carrier_name: "...", carrier_mc_number: "884213", carrier_dot_number: "...", carrier_phone: "...", driver_name: "...", driver_phone: "...", truck_number: "...", trailer_number: "...", make_visible_to_shipper: true }`.
3. The shipper's order page now shows the Carrier Information card.

Driver/truck/trailer details are typically added by hand (they aren't in FMCSA);
the FMCSA lookup fills in the carrier identity and vetting fields.
