# n8n-nodes-mystorelocator

n8n community nodes for [My Store Locator](https://my-store-locator.com/?utm_source=n8n&utm_medium=integration&utm_campaign=n8n-plugin) –
store finder maps for websites, hosted in Germany. Manage locations, read maps and enquiries, and start workflows when locations or
enquiries are added or changed.

[Installation](#installation) · [Credentials](#credentials) · [Nodes and operations](#nodes-and-operations) · [Usage](#usage-and-example-workflows) · [Compatibility](#compatibility) · [Development](#development)

## Installation

In n8n: **Settings → Community Nodes → Install** and enter `n8n-nodes-mystorelocator`
([n8n docs](https://docs.n8n.io/integrations/community-nodes/installation/)). Self-hosted with npm: `npm install n8n-nodes-mystorelocator` in `~/.n8n/nodes`.

## Credentials

**My Store Locator API**
- **API Key** – create it in My Store Locator under **API & Webhooks** (starts with `msl_live_`, shown once). Give it the scopes the
  workflow needs: `locations:read`, `locations:write`, `maps:read`, `leads:read`, and `webhooks:write` for the webhook trigger.
- **Base URL** – leave the default `https://app.my-store-locator.com/api/v1/ext`.

The credential test calls `GET /me`. **API keys are included from the Starter plan** (app v1.11.0). Free accounts
can embed maps but get `403 plan_limit` from the API.

## Nodes and operations

### My Store Locator
| Resource | Operations |
|---|---|
| Location | Create (name + city; address is geocoded when no coordinates are given; optional maps), Get, Get Many (search text, city, ZIP prefix, country, status, category, updated since; Return All with paging), Update (only the fields you add), Archive |
| Map | Get Many (id, name, embed token, published, number of locations) |
| Lead | Get Many (enquiries from the map's contact form, newest first) |
| Category | Get Many |
| Status | Get Many |

Category, status and map fields are dropdowns loaded from your account. The node can be used as an AI agent tool.

### My Store Locator Trigger (polling)
Events: **New Location** (`sort=id&sinceId=<last id>`), **Updated Location** (`sort=updated&updatedSince=<last change>`, pages by time),
**New Lead**. On activation it remembers the current state and then emits only new items. "Fetch test event" returns the latest item.

### My Store Locator Webhook Trigger (real time)
Activating the workflow registers the node's URL in My Store Locator (`POST /api/v1/ext/webhooks`, shown in the app as "über API")
and stores the webhook id and signing secret in the workflow; deactivating removes it again (`DELETE /webhooks/:id`).
Every request is checked against `X-MSL-Signature` (`t=<unix>,sha256=HMAC-SHA256(secret, "<t>.<body>")`, max. 5 minutes old) –
invalid ones get 401. Events: `location.created`, `location.updated`, `location.deleted`, `lead.created`, `map.published`, `import.finished`.
The key needs `webhooks:write` plus the read scope of the events. Webhooks are included from Starter as well (Starter 10, Pro 25).

## Usage and example workflows

1. Create a **My Store Locator API** credential with your API key (see [Credentials](#credentials)) and click **Test**.
2. Add the **My Store Locator** node, pick a resource and an operation, and select the credential.

**Sync stores from a spreadsheet** – Google Sheets (or any source) → **My Store Locator: Location → Get Many** with the store's name
or ZIP as search → **If** found → **Location → Update** with the changed fields, otherwise **Location → Create** (name + city;
the address is geocoded). Rows that should disappear → **Location → Archive**.

**Send new enquiries to your team** – **My Store Locator Webhook Trigger** (event `lead.created`) → Slack / e-mail / CRM node.
Without a public n8n URL use the **My Store Locator Trigger** (polling, event *New Lead*) instead.

**Keep another system up to date** – **My Store Locator Trigger** (event *Updated Location*) → HTTP Request or database node that
writes the changed store into your ERP, shop or CRM.

**Report your maps** – **Schedule Trigger** → **My Store Locator: Map → Get Many** → spreadsheet with the map name, embed token,
published state and number of locations.

As an **AI agent tool** the node lets an agent look up stores ("Which store is open in Hamburg?") with *Location → Get Many*.

## Compatibility

Built with `@n8n/node-cli` 0.53 and `n8n-workflow` 2.x (n8n 1.x and 2.x, nodes API version 1). Tested with n8n 2.40.7. No runtime dependencies.

## Privacy

Data goes only to the My Store Locator API you configure (servers in Germany). Privacy policy:
[EN](https://my-store-locator.com/en/privacy/) · [DE](https://my-store-locator.com/datenschutz/). The nodes do not track anything.

## Development

```bash
npm install --ignore-scripts   # isolated-vm (from n8n-workflow) needs Node 24 to compile; not needed for build/lint
npm run build                  # n8n-node build → dist/
npm run lint                   # n8n-node lint (community node rules) – must be clean
npm test                       # build + node:test unit tests with a fake n8n context (no network)
npm run dev                    # local n8n with the nodes loaded (needs Node 24 for n8n itself)
```

## License

[MIT](LICENSE.md)
