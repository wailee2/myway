# Checkpoint: validate with real commuters

**When:** after Phase 3 (search → results → ride details → seat), before investing further in checkout, the backend and driver tools.
**Who:** 5 to 8 people who actually travel a corridor such as Nyanya → CBD. Mix of riders who already use "along" buses and people who don't.
**How:** 15 minutes each, on their own phone, `NEXT_PUBLIC_DEMO=true`. Don't explain the app. Ask them to think aloud.

## Tasks (read aloud, one at a time)
1. "You need to get to CBD tomorrow morning. Find a ride." (Home → search → results)
2. "You want to be dropped near Jabi Lake Mall. Find one." (stop search, Jabi area)
3. "Pick a seat you'd be comfortable in." (seat picker)
4. "Where would you wait for the car? How would you know it's the right one?"
5. "What happens if only one person books?" (departure rule)
6. "What if you need to cancel?" (cancellation)

## Questions
- In your own words, what does MYWAY do? (Do they get "find someone already going your way"?)
- Could you find your pickup and drop-off stop without help?
- What would you want to know about the driver before getting in?
- How would you want to pay? What worries you about paying first?
- Where did you hesitate, re-read or go back?

## What to record
| Signal | Where |
|---|---|
| Time from opening the app to reaching ride details | `localStorage["myway.events"]` (`search`, `ride_selected`, `booked`) |
| Searches with 0 results | event `search` with `results: 0` |
| Stop-finding failures | observer notes |
| Trust questions (ID, plate, who else is in the car) | observer notes |

Decide after the sessions: what changes before checkout and the backend are built around these flows.
