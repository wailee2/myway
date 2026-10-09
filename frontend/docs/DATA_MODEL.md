# Location, route and booking model (roadmap Phase 1)

```
Area ──< Stop            name, landmark, lat/lng, pickup allowed, drop-off allowed, aliases
Route ──< RouteStop      ordered stops with minutes + km from start (segment pricing is possible later)
Route ──< Trip           one departure: time, driver, all-in price, seats
Trip  ──< Booking        rider, seat, pickup stop, drop-off stop, status, progress, price paid
User  ──< SavedRoute     "usual route": from, to, days, approximate time
Wallet ledger            append-only; balance is the sum
```

Rules the app already follows (see `lib/data/stops.ts`, `lib/data/trips.ts`):

- **Designated stops only.** No free-form addresses. Every booking is `pickup stop → drop-off stop`.
- A trip serves a rider if both stops are on its route, **pickup comes before drop-off**, and the stop allows that use (e.g. Jabi Under Bridge is drop-off only).
- **Near matches:** if no trip uses the exact stop, a stop in the *same area* within 600 m is offered, with an honest reason ("Drops you 500 m from Jabi Under Bridge").
- Typing an **area** ("Jabi") lists every stop in it; landmarks, estates and malls are search aliases.
- **Trip-level fares first.** `RouteStop.km` exists so segment pricing can be switched on without a data change.
- Seed coordinates are derived from the illustrative map, **not surveyed GPS**. Survey the stops and verify each landmark on the ground before launch.

Postgres schema for the backend: `docs/BACKEND_SCHEMA.sql`. Booking integrity relies on a unique constraint, so two riders cannot take the same seat even under a race.
