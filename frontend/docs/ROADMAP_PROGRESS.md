# Roadmap progress

✅ built · 🟡 partly built · ⬜ not built (reason)

> Verified by: `tsc --noEmit` clean, `next build` succeeds, and a Node test of the stop-matching logic. **Not yet clicked through in a real browser or on a phone.** Do that pass first (see `COMMUTER_TEST_PLAN.md` for tasks).

## Gate: decisions
✅ Provisional defaults coded once in `lib/policy.ts`; sheet in `DECISIONS.md` for sign-off. ⬜ Supervisor agreement (yours to get).

## Phase 0: quick fixes
- ✅ `.stickern`/`.sticker-lgn` renamed so the outline + hard shadow render. ✅ "MYWAY" casing. ✅ Chips, segmented controls, steppers, icon buttons 44–48px.
- 🟡 Weight 800 reserved for headlines/prices: chips and several labels lowered; a full sweep of every screen is still worth doing.
- ✅ One `DEMO` flag (`lib/demo.ts`); demo data centralised; placeholders removed (`tel:+234000…`, `MYWAY/Wailee`, fake earnings, fake fuel price, hard-coded driver details).
- ✅ Dynamic greeting and dates; day chips filter results; dead `lg:` layouts deleted.
- ✅ Map `viewBox` computed from route, stops and markers (`frameFor`).

## Phase 1: locations, routes, search
- ✅ Area → Stop → Route model with landmarks, coordinates, pickup/drop-off flags, minutes + km.
- ✅ Designated stops only; trip-level fares (segment pricing coded, off).
- ✅ Search sheet: autocomplete, recent, popular, landmark aliases, "use my location" (with error + manual fallback), whole-area listing ("Jabi").
- ✅ Usual routes data model + UI. ✅ Backend schema (`BACKEND_SCHEMA.sql`).
- 🟡 Seed coordinates are derived from the illustrative map, not surveyed GPS.

## Phase 2: home and identity
- ✅ "Find someone going your way", shared ride first, usual routes, search, bus second, map removed from Home, wallet balance on Home.
- ✅ Consistent rider language. ✅ Rider ID check moved to first booking; drivers/operators verify up front. ✅ OTP resend + auto-submit at 6 digits. ✅ Shorter splash after first load.

## Phase 3: results and trip details
- ✅ "Rides for your route"; When / Sort / Filter separated; Earliest default. ✅ Explainable reasons computed from real data; no invented scores. ✅ Card hierarchy; all-in price from search onward.
- ✅ Flattened trip details with meet-by, walking time (when location is known), driver, vehicle, route, policy, drop-off chooser. ✅ "2 of 4 seats booked" + co-rider avatars; labelled driver seat.
- ✅ Loading, empty, error, location-error states. ⬜ "Best match" sort (waits for real ranking data, as the roadmap says).

## Checkpoint
🟡 Test plan and local event log written; the sessions themselves are yours to run.

## Phase 4: checkout
- ✅ Tab bar hidden through checkout; sticky Reserve seat bar. ✅ Policy wording identical everywhere. ✅ Wallet check with inline top-up and fallback method preselected. ✅ Confirmation sheet for passes. ✅ Typed error codes. ✅ Top-ups pending until confirmed.

## Phase 5: after booking, safety, communication
- ✅ Lifecycle Assigned → On the way → Arriving → Boarded → Dropped off. ✅ Pickup block with large plate + colour + make, landmark, meet-by. ✅ Departure rule before payment and on the booking screen.
- ✅ Failure states: driver late, driver cancelled (refund + alternatives), rider no-show. ✅ Drop-off summary, receipt, rating from empty with issue tags, optional tip, Report a problem.
- ✅ Safety in the header during active trips; SOS hold 3 s; trusted contacts with phone numbers; trip sharing; reports filed with a reference.
- ✅ Quick messages; masked-call mock (ringing, connected, mute, speaker, end, no-answer fallbacks, time window). ⬜ Real telephony and WebRTC (Tier 3, later by design).
- ✅ Service worker + manifest; cached booking details labelled as possibly out of date.

## Phase 6: backend
⬜ **Not built.** Schema, typed errors and the `searchRides` API boundary are ready for it. Suggested first slice: one route, real auth, real trips, atomic seat holds (`seat_holds` unique constraint), real bookings.

## Phase 7: driver and operator
- ✅ Driver home leads with Next trip (seats booked, expected earnings); Go online separate from Post a trip; repeat defaults OFF; no-show handling before departure; earnings/history computed from real trip data; sample demand labelled "Sample data".
- 🟡 Operator: instant full-screen green/red scan feedback with the scanned passenger's details; manifest counts are real. ⬜ Desktop layout and rider lookup (bus is secondary).

## Phase 8: accessibility and polish
- ✅ 12px tab labels; ✅ danger contrast fixed (`--danger-solid`); ✅ Segmented is a radio group; ✅ dialog focus trap + focus return; ✅ bus "Max 4 seats" message, next-departure default, offline ticket.
- 🟡 Keyboard and screen-reader pass done for new components only; a full audit with a screen reader is still needed.
- ⬜ USSD/local payment options; final responsive audit (small phone, tablet, landscape).
