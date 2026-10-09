# MYWAY · web app (MVP)

**Find someone already going your way.** Shared rides with verified drivers (and scheduled buses) for Abuja.

This is a **front-end MVP**: it shows how MYWAY would look and behave as a finished product. Everything works end to end (onboarding, search, seat selection, checkout, tickets, wallet, ratings, driver and operator tools), but all data is **mock and simulated**. There is no backend, no real payments and no real maps. See [docs/SYSTEM_GUIDE.md](docs/SYSTEM_GUIDE.md) for how to take it to production.

| | |
|---|---|
| Framework | Next.js **16** (App Router, Turbopack, React Compiler on) |
| UI | React **19**, Tailwind CSS **v4** (`@theme` in CSS, no `tailwind.config`) |
| State | Zustand 5 (persisted to `localStorage`) |
| Language | TypeScript (strict) |
| Structure | **No `src/` folder**: `app/`, `components/`, `features/`, `lib/`, `public/` live at the project root |

---

## 1. Install and run

**Requirements:** Node.js **20.9+** (22 LTS recommended; an `.nvmrc` is included) and npm 10+.

```bash
unzip myway.zip && cd myway
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config, eslint-config-next 16)
```

Packages are pinned with caret ranges to the latest at the time of writing (`next ^16.3.8`, `react ^19.3.0`, `tailwindcss ^4.3.3`, `@tailwindcss/postcss ^4.3.3`, `zustand ^5.0.15`). `package-lock.json` is included for reproducible installs. To update everything later: `npx npm-check-updates -u && npm install`.

> **Internet needed on first build.** Fonts (Bricolage Grotesque and Plus Jakarta Sans) are fetched from Google Fonts by `next/font` at build time and then self-hosted. If you are fully offline, edit `app/fonts.ts` to use `next/font/local`.

### Demo mode

Everything that exists only to make the prototype demonstrable (demo accounts, "move the trip along" controls, sample demand numbers, demo OTP notes, seeded history) sits behind **one flag**: `NEXT_PUBLIC_DEMO` (default on; set `false` to remove it all). See `lib/demo.ts` and `.env.example`.

### Where the plan lives

`docs/ROADMAP_PROGRESS.md` maps every roadmap item to what is built. `docs/DECISIONS.md` holds the provisional business rules (`lib/policy.ts`). `docs/DATA_MODEL.md` and `docs/BACKEND_SCHEMA.sql` describe the stop/route model and the Postgres schema.

### Demo walkthrough (about 2 minutes)

1. Open `/` (landing page). Use the **Find your seat** widget, or click **Open the app**.
2. Complete `/get-started` (any valid-looking data works: phone `803 123 4567`, any 6-digit code, any 11-digit NIN, tap the selfie tile).
3. **Rider:** Home → tap Pickup, search "Jabi" → pick a drop-off → Find a ride → choose a ride → choose a seat → Reserve seat → the first booking asks you to confirm your ID once → booking page. Use the **Demo: move the trip along** chips (and *Driver late / Driver cancels / Rider no-show*) to see every state, then rate the ride (stars start empty).
4. **Bus:** Bus tab → line N1 → pick a departure and seat → pay → QR ticket.
5. **Wallet:** watch the balance and activity change. Try an unaffordable payment to see the error and top-up path.
6. **Safety:** press and hold the SOS tile for 3 seconds.
7. **Driver** (`/drive`, dark UI): Post a trip → Live trip. Seats fill by themselves; verify riders with the demo codes shown on screen, start and end the trip, then withdraw earnings.
8. **Operator** (`/operator`): dashboard, manifest, ticket scanning (type `N1-4B`).

To reset the demo, clear site data for `localhost:3000` (or run `localStorage.clear()` in the console). **Profile → Log out** also resets the session.

---

## 2. Routes

| Route | What it is |
|---|---|
| `/` | Marketing landing page (hero widget, problem, how it works, products, safety, drivers, FAQ) |
| `/get-started` | Onboarding: role → phone → OTP → ID check → location |
| `/app` | Rider home: Car/Bus switch, route picker, live-style map |
| `/app/search` | Car results with day and filter chips (`?from=nyanya&to=cbd`) |
| `/app/trip/[id]` | Trip details, driver card, seat picker |
| `/app/checkout` | Payment method, price breakdown, pay (`?kind=car` or `bus`) |
| `/app/booking/[id]` | Boarding code, live tracking (simulated), cancel, share; bus QR ticket |
| `/app/rate/[id]` | Star rating, tags, tip |
| `/app/bus`, `/app/bus/[line]` | Bus lines, timetable, seat map |
| `/app/passes` | Commuter passes |
| `/app/trips` | My trips: upcoming, past, cancelled |
| `/app/usual` | Usual routes: saved route, days, approximate time |
| `/app/wallet`, `/app/wallet/top-up` | Balance, activity, top-up by transfer |
| `/app/notifications` | Notification centre |
| `/app/safety` | SOS (hold 3s), trusted contacts, auto-share |
| `/app/profile`, `/app/help`, `/app/request-route` | Account, FAQ search, route requests |
| `/drive`, `/drive/post`, `/drive/live`, `/drive/earnings`, `/drive/withdraw`, `/drive/vehicle` | Driver app (dark theme) |
| `/operator`, `/operator/manifest`, `/operator/scan` | Bus operator console |

The app routes are guarded client-side: if onboarding is not complete you are redirected to `/get-started`.

---

## 3. Design system (`app/globals.css`)

`globals.css` is the **single source of truth**. It has five labelled sections: tokens (`:root`), token→Tailwind mapping (`@theme inline`), scales (`@theme`: type, radius, shadow, motion, animations), base styles (`@layer base`), and a few component patterns (`@layer components`).

### Colour tokens

Use them as Tailwind utilities (`bg-primary`, `text-fg-muted`, `border-line`, ...).

| Token (CSS var) | Utility | Light | Dark | Use |
|---|---|---|---|---|
| `--background` | `bg-background` | `#fbf7ea` | `#0d0d0d` | Page canvas |
| `--surface`, `--surface-raised`, `--surface-sunken` | `bg-surface`… | white / white / `#f3eedc` | `#171717` / `#1f1f1f` / `#111` | Cards, popovers, inputs |
| `--primary` (+ `-hover`, `-active`, `-soft`, `-foreground`) | `bg-primary`, `text-primary-fg` | danfo yellow `#ffc61a` | same | Main actions, brand |
| `--secondary` (+ `-hover`, `-foreground`) | `bg-secondary`, `text-secondary-fg` | ink `#0d0d0d` | cream `#f5f1e3` | Inverse blocks, secondary actions |
| `--accent` (+ `-soft`, `-text`) | `bg-accent`, `text-accent-text` | Naija green `#0a8f4e` | `#22c27a` | Success-leaning accents |
| `--text-primary` | `text-fg` | `#0d0d0d` | `#f7f4ea` | Body and headings |
| `--text-secondary` | `text-fg-secondary` | `#3a3933` | `#d2cfc3` | Supporting text |
| `--text-muted` | `text-fg-muted` | `#6b6a63` | `#a3a196` | Captions, hints |
| `--text-disabled` | `text-fg-disabled` | `#a9a79c` | `#5c5b55` | Disabled controls |
| `--border`, `--border-strong`, `--outline`, `--ring` | `border-line`, `border-line-strong`, `border-outline`, `ring` | | | Borders, sticker outline, focus ring |
| `--success`, `--warning`, `--danger`, `--info` (+ `-soft`, `-text`) | `bg-success-soft text-success-text`… | | | Feedback states |
| `--map-*` | `fill-map-land`… | | | Map palette (theme-aware) |

### Theming

- Default: follows the OS (`prefers-color-scheme`).
- Force a theme with `<html data-theme="light|dark">`. The **ThemeToggle** (system → light → dark) stores the choice in `localStorage`; an inline script in `app/layout.tsx` applies it before paint, so there is no flash.
- Any wrapper can scope a theme: the driver app wraps itself in `<div data-theme="dark">`.

### Other tokens

- **Type scale:** `text-display-xl | -lg | -md`, `text-title`, `text-body-lg`, `text-caption` (tracking tightens as size grows).
- **Fonts:** `font-display` (Bricolage Grotesque), `font-sans` (Plus Jakarta Sans).
- **Radius:** `rounded-sm … rounded-2xl`. **Shadows:** `shadow-hard`, `shadow-hard-lg`, `shadow-soft`.
- **Motion:** `ease-out-strong`, `ease-in-out-strong`, `ease-drawer`; `animate-rise | fade | pop | drive | spin-wheel | pulse-ring`.
- **Brand patterns:** `.sticker` / `.sticker-lg` (thick ink outline + hard shadow), `.stripe-band` (danfo stripe), `.stagger` (staggered entrance via `style={{"--i": n}}`), `.pressable` (press feedback), `.rail` (scroll chips), `.glass`.

### Motion and accessibility rules baked in

- Press feedback is instant (`scale(.97)` on `:active`); transitions stay under 300 ms with custom easing; no `ease-in` on UI.
- `prefers-reduced-motion` removes movement; `prefers-reduced-transparency` disables the glass blur.
- Visible `:focus-visible` ring, skip link, semantic landmarks, `aria-live` on dynamic status, keyboard support on custom controls (tabs, radios, switches, SOS hold button).

---

## 4. Project structure

See `FILE_STRUCTURE.txt` for the full tree. In short:

```
app/            routes only (thin wrappers) + globals.css + fonts + root layout
  (marketing)/  landing page layout (header/footer)
  (auth)/       /get-started
  (rider)/app/  rider app routes   ->  features/rider
  (driver)/drive/   driver routes  ->  features/driver
  (operator)/operator/  operator   ->  features/operator
components/
  ui/           design-system primitives (Button, Icon, Field, Switch, Segmented, Badge…)
  layout/       AppShell, header, footer, theme toggle, page header
  illustrations/ danfo, car, seats, pay, shield, logo, QR
  map/          MapCanvas (theme-aware SVG map)
features/       screen-level components per product area
lib/            types, pricing, formatting, mock data, Zustand stores, hooks
```

Conventions: route files stay thin; all UI lives in `features/*` or `components/*`; client components are marked `"use client"` only where needed; `@/*` maps to the project root.

---

## 5. State and data

- `lib/store/session.ts`: name, phone, role, onboarding flag, language.
- `lib/store/booking.ts`: wallet balance, transactions, bookings, notifications, booking draft, and the actions `confirmCar`, `confirmBus`, `cancel`, `rate`, `topUp`, `spend`.
- `lib/store/driver.ts`: online state, posted trip, balance, withdraw.
- Stores persist to `localStorage` with `skipHydration`, and `useHydrated()` rehydrates after mount so server and client markup always match.
- Mock data: `lib/data/*` (stops, trips, drivers, bus lines, FAQ, notifications). Riders see ONE all-in price (no fee or fuel line); front seat +₦300. Business rules: `lib/policy.ts`. Pricing: `lib/pricing.ts`.

---

## 6. Known limitations (by design for an MVP)

- No backend, auth, database or real payments; OTP and NIN checks accept any well-formed input.
- The map is an illustrative SVG, not real geography. Live tracking is simulated by the demo chips.
- Boarding codes and QR are generated client-side (the QR is a visual stand-in, not a scannable code).
- Data lives in the browser, so it is per device and resets when storage is cleared.
- Copy is English only; the language switch stores the preference but does not translate yet.

## 7. Deploy

`npm run build` produces a standard Next.js build. Deploy to Vercel (zero config), or any Node host with `npm run start`. Set `NEXT_PUBLIC_SITE_URL` to your public URL for correct metadata.

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| Prices show a different "₦" glyph | Make sure `latin-ext` is in the font subsets (`app/fonts.ts`). |
| Stuck on `/get-started` after reload | Onboarding state lives in `localStorage`; complete it once, or check that storage is not blocked. |
| Build fails fetching fonts | You are offline. Switch `app/fonts.ts` to `next/font/local`. |
| Wrong theme colours | Remove the `data-theme` attribute or clear the `myway.theme` key in `localStorage`. |
"# myway" 
