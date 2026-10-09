# Data protection and support: cross-cutting checklist

These run alongside the build phases. **None of this is legal advice**; get the data-protection items reviewed by someone qualified before storing real data.

## Data protection (start by Phase 1, finish by Phase 8)
Sensitive items: **NIN, selfie, location history, call logs, trusted-contact phone numbers.**
For each, decide and write down (Nigeria Data Protection Act): lawful basis / consent, purpose, retention period, who can access it, how a person can see or delete it.
- Today the prototype stores everything **on the device only** (localStorage). No NIN or selfie leaves the phone, and the NIN is not even kept.
- Do not record call audio unless consent and legal requirements are cleared. The call screen is a mock; no telephony provider is attached.
- Analytics (`lib/analytics.ts`) logs events locally only. Add consent before sending anywhere.

## Support and moderation (before launch)
Report a problem, SOS and driver complaints are built to **file a record** (`reports`, `sos_events` in the schema). They only help if a person reads them. Define:
- who monitors the queue and when (hours),
- response targets (SOS: minutes; reports: hours),
- what actions they can take (contact rider, suspend driver, refund),
- how the rider is told the outcome.
Until then the app does not claim anything it can't keep (the demo SOS says no alert is actually sent).

## Success measures
| Measure | Event(s) in `lib/analytics.ts` |
|---|---|
| Searches that lead to a booking | `search` → `booked` |
| Time from open to booking | `booked.ms` (from `startFlow()` on Home) |
| Repeat bookings on usual routes | `usual_saved` + `booked` |
| Cancellations and no-shows | `cancelled` with `by` |
| Safety reports per 1,000 trips | `sos`, reports table |
| Seats filled per trip | backend |
