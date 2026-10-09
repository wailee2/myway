# MYWAY system guide

How the MVP is built, why, and how to evolve it into a real product.

## 1. Product model in one page

- **Two supply types, one booking experience.** *Cars:* shared, **max 4 passengers**, leave when full or on time, driven by verified partners who post trips they already make. *Buses:* partner-operated, scheduled corridors with seat maps, QR tickets and passes.
- **Asset-light.** MYWAY owns no vehicles. Revenue (illustrative): commission per seat (about 10-15% cars, 15-25% buses), booking fees, passes and employer plans, operator software.
- **Built for Nigeria:** cash option with a wallet hold, landmark stops, fuel-linked fare adjustment, low-data booking (WhatsApp/USSD in the roadmap), ID verification, SOS and women-only cars.

## 2. Architecture

```
Browser
 ├─ Next.js App Router (RSC for shells/metadata, client components for interactive screens)
 │    app/*  ──►  features/*  ──►  components/ui, components/map, components/illustrations
 │                      │
 │                      ▼
 │            lib/store/*  (Zustand, persisted)  ◄──►  lib/data/*  (mock "API")
 │                      │
 │                      ▼
 │            lib/pricing.ts, lib/format.ts, lib/types.ts
 └─ globals.css (tokens → Tailwind v4 @theme)
```

**Layers**

1. **Routes (`app/`)**: thin; only metadata, async `params`/`searchParams` handling and composition.
2. **Features (`features/`)**: screen-level components grouped by product area (landing, auth, rider, driver, operator).
3. **Components (`components/`)**: reusable, presentation-only building blocks. No store access except `AppShell`.
4. **Domain (`lib/`)**: types, pricing, stores, mock data. The only layer that knows business rules.

**Why these choices (MVP-appropriate)**

- *Zustand + localStorage* instead of a server: fastest way to make every flow "real" for demos. Each store action maps 1:1 to a future API call.
- *Route groups* `(marketing) (auth) (rider) (driver) (operator)` give each audience its own layout without affecting URLs.
- *Tailwind v4 `@theme`* keeps tokens in CSS; no JS config. Colours are CSS variables, so theming and per-subtree theming are free.
- *React Compiler* is enabled, so there is no manual `useMemo`/`useCallback`.
- *Async request APIs:* `params` and `searchParams` are Promises in Next 16 and are awaited in the route files.

## 3. Key flows

**Car booking:** `/app` (route) → `/app/search` (filter) → `/app/trip/[id]` (seat) → writes `draft` in the booking store → `/app/checkout` → `confirmCar()` validates wallet, creates a `Booking`, debits the wallet, records a transaction → `/app/booking/[id]` → progress simulation → `/app/rate/[id]`.

**Bus booking:** `/app/bus/[line]` (departure + up to 4 seats) → `/app/checkout?kind=bus` → `confirmBus()` → QR ticket on `/app/booking/[id]`.

**Cancellation:** `cancel(id)` refunds wallet payments and adds a refund transaction.

**Driver:** `/drive/post` → `publish()` → `/drive/live` (seats fill on a timer, rider codes verified, start/end trip) → earnings credited → `/drive/withdraw`.

## 4. Theming mechanics

- `:root` holds static tokens; light values live on `:root, [data-theme="light"]`; dark values apply via `@media (prefers-color-scheme: dark)` (unless `data-theme="light"`) **and** via `[data-theme="dark"]`.
- `@theme inline` maps each variable to a Tailwind colour (`--color-primary: var(--primary)`) so utilities always read the live variable.
- We avoid CSS `light-dark()` on purpose: Tailwind's CSS pipeline rewrites it in a way that breaks forced and scoped themes.

## 5. Accessibility checklist (implemented)

Skip link; landmarks; one `h1` per page; visible focus ring; labelled inputs with error/hint wiring (`aria-describedby`, `role="alert"`); `aria-live` for status; radio/tab/switch roles with arrow-key support; native `<dialog>` for confirmations; focus moved to the step heading in onboarding; reduced-motion and reduced-transparency honoured; colour is never the only signal (icons + text on badges and seats).

## 6. Moving from MVP to production

| Area | MVP | Production path |
|---|---|---|
| Auth | Local flag | Phone OTP via a provider (e.g. Termii, Twilio Verify), sessions in HttpOnly cookies, Next.js `proxy.ts` for route protection |
| Identity | Any 11 digits | NIN/BVN verification through a licensed provider (Smile ID, Dojah, Prembly) + selfie liveness |
| Data | `lib/data` + Zustand | Postgres (Neon/Supabase) with Drizzle or Prisma; replace store actions with Server Actions / route handlers; keep Zustand for UI-only state or switch to TanStack Query |
| Payments | Simulated wallet | Paystack or Flutterwave (virtual accounts for transfers, cards, webhooks), ledger table with double-entry records, idempotency keys |
| Maps and tracking | SVG | Mapbox/Google Maps; driver GPS via the Geolocation API; realtime via WebSockets/SSE (Ably, Pusher or Supabase Realtime) |
| Dispatch | Timers | Server-side trip state machine: posted → filling → departing → in-progress → complete; leave-when-full logic on the server |
| Notifications | Static | Web push + SMS/WhatsApp (Termii, WhatsApp Business API); USSD booking via an aggregator |
| Safety | UI only | SOS webhook to a monitored control room, trip-share links, incident reports, driver document expiry jobs |
| Pricing | Constants | Pricing service reading pump price, route cost and demand; fare caps per route |
| Observability | None | Sentry, Vercel Analytics, structured logs, uptime checks |
| Testing | Manual + typecheck | Vitest for `lib/`, Playwright for the booking flow (the happy path in this repo's demo walkthrough is a ready-made script) |

**Suggested order:** auth → database + trip/booking APIs → payments + ledger → realtime tracking → notifications → safety tooling → operator tools.

## 7. Adding things

- **New icon:** add its paths to `components/ui/icon.tsx` (`iconPaths`).
- **New colour token:** add the variable in the light block and the two dark blocks, then map it in `@theme inline`.
- **New page:** create `app/(group)/path/page.tsx`, a screen in `features/…`, and (if it belongs in navigation) an entry in `NAV` in `components/layout/app-shell.tsx`.
- **New stop/route/line:** extend `lib/data/stops.ts`, `trips.ts`, `bus.ts`.

## 8. Security notes for later

Never trust client-side prices: recompute fares, fees and wallet debits on the server. Validate all inputs with a schema library (e.g. Zod) at API boundaries. Treat boarding codes as short-lived secrets (rotate, rate-limit verification attempts). Store no raw NIN; keep only a verification reference. Add CSRF protection for cookie sessions and a strict Content-Security-Policy.
