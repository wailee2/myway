# MYWAY: decisions sheet (roadmap "Gate")

One page to agree with the supervisor. Every rule below is **provisional**: it is already built into the app so screens can be finished, but it is only a proposal until signed off. All of it lives in `lib/policy.ts`, so changing a decision is a one-file edit and the wording stays identical on trip detail, checkout, the booking screen and the cancel dialog.

| # | Decision | Proposed default (what the app does now) | Agreed? |
|---|---|---|---|
| 1 | Fare model | **Per trip.** One all-in price; front seat +₦300. Segment pricing is coded behind `POLICY.fareModel = "segment"` but off. | ☐ |
| 2 | Departure rule | Car leaves at the posted time (or sooner if all 4 seats fill) **even if some seats are empty**. | ☐ |
| 3 | Cancellation | Free until 30 min before pickup; after that, no refund. | ☐ |
| 4 | No-show | Driver waits 5 min at the stop; rider no-show = seat released, no refund, driver still paid. | ☐ |
| 5 | Driver cancels | Automatic full refund to wallet, notification, alternative rides shown. | ☐ |
| 6 | Call costs | MYWAY pays. Masked calls, 3 min per call, from booking until 30 min after drop-off. **Needs a viability check at current fares.** | ☐ |
| 7 | Commission and payout | 10% commission. Withdrawals instant, 1 free per day then ₦50, ₦1,000 minimum. | ☐ |

Open questions this raises for the supervisor:
- If only one rider has booked, is the driver obliged to go (rule 2)? If not, what minimum applies and how early is the rider told?
- Is "no refund after the free window" acceptable commercially, or should late cancellations get a partial refund?
- The fare formula (fuel, time, distance, labour) currently feeds only the *driver fare guide* (`fareGuide` in `lib/pricing.ts`) using sample rates. Rider prices are seed data.
