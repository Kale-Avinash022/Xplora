# XPLORA Provider Integration Guide: Train & Bus Live Inventory

> **Document Version:** 1.0  
> **Status:** Active Reference for Engineering  
> **Target Providers:** Railway Systems (e.g., IRCTC / Qrail / ConfirmTkt API) & Bus Aggregators (e.g., RedBus / AbhiBus B2B API)

---

## 1. Architecture & Guiding Philosophy

XPLORA operates on a **Truth-First Travel Architecture**:
1. **Zero Fabricated Inventory:** Never invent seat counts, schedule times, pricing quotes, or fake station stops.
2. **Transparent Capabilities:** When a live provider is not integrated, unconfigured, or failing, the system must immediately fail-closed and display a clear, informative unavailable panel.
3. **Verified External Handoff:** Booking transactions require validated, deep-linked provider URLs (`https:`) on approved partner domains.

---

## 2. Train Provider Integration (IRCTC / Qrail Partner APIs)

### 2.1 Prerequisites & Legal Agreements
- **Commercial Relationship:** Official B2B aggregator contract or IRCTC Principal Service Provider (PSP) sub-license.
- **Security Audit:** Compliance with IRCTC information security guidelines and ISO/IEC 27001 data protection standards.
- **Credentials:** Dedicated Partner Client ID, HMAC Secret / Private Key, and Whitelisted Static Outbound IP Addresses.

### 2.2 API Contract & Schema Requirements
A compliant train provider must deliver:
- **Station Search & Resolution:** Mapping between city names, human-readable station names, and standard Indian Railway station codes (e.g., `NDLS`, `CSMT`, `SBC`, `MAS`, `PNQ`, `NGP`).
- **Live Train Schedules:** Train number, train name, departure time, arrival time, duration, and days of run.
- **Real-Time Availability:** Berth/seat availability across classes (`1A`, `2A`, `3A`, `3E`, `SL`, `CC`, `EC`, `2S`) with status (`AVAILABLE`, `RAC`, `WL`).
- **Dynamic Fare Breakdown:** Base fare, reservation fee, superfast charge, Tatkal surcharge (if applicable), and GST.
- **Direct Booking Link / PNR Handoff:** Verified HTTPS booking URL to complete ticket issuance.

### 2.3 Station Code Mapping Strategy
- Use bidirectional station mapping dictionaries (e.g., `lib/travel/providers/qrail/stations.ts`).
- Never default missing or unknown stations to any arbitrary city. If a user queries an unsupported station or city, return `INVALID_REQUEST` with clear user guidance.

### 2.4 Rate Limits & Caching
- **Quota Management:** Upstream rate limits typically range from 10 to 50 requests per second.
- **TTL Cache Policy:** Cache train search results for at most 10–15 minutes using deterministic keys:
  `train:${originCode}:${destCode}:${travelDate}:${travelClass}`
- Never cache `UNAVAILABLE` or `INVALID_REQUEST` states.

---

## 3. Bus Provider Integration (RedBus / AbhiBus APIs)

### 3.1 Prerequisites & Legal Agreements
- **RedBus / AbhiBus API Agreement:** Signed B2B Affiliate or Aggregator Agreement.
- **KYC & Security Clearance:** Verified business entity, tax compliance, and PCI-DSS compliance if collecting payment data directly.
- **Credential Storage:** Store `REDBUS_API_KEY` and `REDBUS_CLIENT_SECRET` exclusively on the server side (`lib/config/capabilities.ts`). Never expose with `NEXT_PUBLIC_` prefixes.

### 3.2 API Contract & Data Schema
A compliant bus provider must return:
- **Route Search:** Available bus services between source and destination city/station IDs.
- **Operator Details:** Fleet operator name, bus type (e.g., `AC Sleeper`, `Multi-Axle Scania Semi-Sleeper`, `Non-AC Seater`).
- **Timing & Boarding Points:** Specific departure time, arrival time, total journey duration, boarding point addresses with landmark details, and dropping point locations.
- **Seat Availability & Live Fares:** Real-time seat counts and accurate fare quotes per seat type.
- **Direct Booking Deep-Link:** Authorized URL targeting the specific route and date on the partner domain (`redbus.in`).

### 3.3 Destination & Geometry Normalization
- For offline or local routes, XPLORA provides local calculation (e.g., `bus_destination.txt` distance metrics from reference transit hubs).
- When promoting to live provider inventory, map origin and destination inputs to verified provider City IDs via an explicit lookup table.

---

## 4. Capability Flags & Server-Only Boundaries

All provider integrations must connect through `lib/config/capabilities.ts`:

```typescript
export interface TravelCapabilities {
  liveFlightsEnabled: boolean;
  liveStaysEnabled: boolean;
  geminiChatEnabled: boolean;
  liveTrainsEnabled: boolean;
  liveBusesEnabled: boolean;
}
```

### Fail-Closed Provider Key Rule
If `QRAIL_API_KEY` or `REDBUS_API_KEY` is not set or empty:
1. `getServerCapabilities().liveTrainsEnabled` or `liveBusesEnabled` evaluates to `false`.
2. Provider functions return `{ status: 'UNAVAILABLE', results: [], count: 0, notice: '...' }` immediately.
3. No external HTTP requests are dispatched.
4. No synthetic, guessed, or static catalog data is ever displayed to the user.

---

## 5. Security & Verification Checklist

Before enabling live inventory for any new provider:
- [ ] Server-only environment variables configured in `.env.local` without `NEXT_PUBLIC_` exposure.
- [ ] Upstream API keys redacted from all console logs and network envelopes via sanitization helpers.
- [ ] Provider booking URLs strictly verified using `validateProviderUrl()` against an approved domain whitelist.
- [ ] Circuit breaker and request timeout policies configured in `lib/http/fetchPolicy.ts`.
- [ ] Automated unit and normalization tests added in `__tests__/` verifying parsing, error handling, and zero data fabrication.
