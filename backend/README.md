# MYWAY API (FastAPI)

The Phase 6 backend for the MYWAY app. FastAPI + SQLAlchemy 2, SQLite for development, PostgreSQL for production.
It implements the schema in the frontend repo's `docs/BACKEND_SCHEMA.sql` and returns the **same typed error codes** the frontend already switches on.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload        # http://localhost:8000/docs  (interactive API docs)
pytest                               # 25 tests, ~1 s
```

On first start it creates the tables and seeds areas, stops and routes, and, while `DEMO=true`, demo users and trips for today + 3 days.
Demo sign-in: any number below with code **123456**: rider `8011111111`, driver `8022222222`, operator `8033333333`.

## What is enforced on the server
| Rule | How |
|---|---|
| Two riders can never hold one seat | Partial **unique index** on live bookings `(trip_id, seat)`. The loser gets `SEAT_TAKEN` and is not charged. Tested with 6 simultaneous requests. |
| Money can't be edited | Wallet balance = sum of an **append-only ledger**. Rows are only inserted. |
| Top-ups are never trusted from the client | A top-up is `pending` until the payment provider's **HMAC-signed webhook** confirms it (amount checked, idempotent by reference). |
| Rider ID at first booking | `POST /bookings` → `ID_REQUIRED` until `POST /me/verify-id`. The NIN is validated and **discarded**, never stored. |
| Cancellation | Free until 30 min before pickup, else no refund. Driver cancel refunds every rider automatically. No-show = no refund, driver still paid. Rules: `app/policy.py`. |
| Only the rider sees their boarding code; drivers only see names, seats and stops. | `booking_out(for_rider=…)` |
| Search matches the frontend | Exact stops, pickup-before-drop-off, pickup/drop-off flags, near-match within 600 m in the same area (with offsets), departed trips hidden. |

## Endpoints (38 paths, see `/docs`)
| Area | Endpoints | Frontend screen |
|---|---|---|
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `GET /me`, `POST /me/verify-id` | Onboarding, login, first-booking ID sheet |
| Catalog | `GET /areas /stops?q= /routes /rides?from&to&day /trips/{id}` | Location sheet, results, trip detail |
| Bookings | `POST /bookings`, `GET /bookings`, `GET /bookings/{id}`, `POST …/cancel`, `POST …/rate`, `GET/POST …/messages` | Checkout, booking view, trips, rate, quick messages |
| Wallet | `GET /wallet`, `POST /wallet/top-ups`, `DELETE …/{id}`, `POST /webhooks/payments`, `POST /dev/top-ups/{id}/confirm` (demo) | Wallet, top-up |
| Driver | `POST/GET /driver/trips`, `…/{id}/progress \| late \| board \| start \| complete \| cancel`, `…/bookings/{id}/no-show`, `GET /driver/earnings`, `POST /driver/withdraw` | Post trip, live trip, earnings, withdraw |
| Safety | `/safety/contacts`, `POST/GET /reports`, `POST /sos`, `/usual-routes`, `POST /route-requests` | Safety, usual routes, request a route |

Errors are always `{"error": {"code", "message", …}}`: `NO_TRIP · NO_SELECTION · SEAT_TAKEN · INSUFFICIENT_FUNDS (shortBy) · ID_REQUIRED · AUTH_REQUIRED · FORBIDDEN · NOT_FOUND · INVALID_OTP · INVALID_INPUT · UNAVAILABLE`.

## Not done: needs a provider, a decision, or a person (marked `TODO(…)` in code)
1. **SMS delivery.** OTPs are generated, hashed and expire, but are only *logged* until an SMS provider is attached (`TODO(sms)`).
2. **Payments.** Wallet and cash-hold bookings work end to end. Card and bank transfer return `UNAVAILABLE`. The top-up endpoint needs a provider to issue the virtual account/checkout link and call the webhook (`TODO(payments)`). Withdrawals debit the ledger and return `queued`; the actual bank transfer isn't triggered.
3. **Real ID verification.** `verify-id` checks the NIN's shape and marks the user verified. It does not call an identity provider (`TODO(kyc)`). Don't launch on this.
4. **SOS and reports.** Both are recorded with a reference; **nobody is notified automatically** (`TODO(ops)`). `acknowledged` is always `false` until a person acknowledges. Don't promise riders a response until a desk exists.
5. **Women-only trips** are stored and filterable, but not enforced at booking: the app doesn't collect rider gender yet.
6. **Cash bookings:** the ₦200 hold is kept by MYWAY (no driver credit) and refunded on cancellation. Whether it counts as commission is a decision for the Gate sheet.
7. **Tests don't cover Postgres.** Row locking (`SELECT … FOR UPDATE`) is a no-op on SQLite; run the suite against Postgres before launch.
8. **Migrations.** Tables come from `create_all` at startup. Add Alembic before the first real deployment.
9. **Rate limiting, audit logging and real operator endpoints** (manifest, scan) are not built.

## Connecting the frontend
The frontend still runs on local stores. The seam is already shaped for this: `lib/api/rides.ts → searchRides` maps to `GET /rides`, `useBooking.confirmCar` to `POST /bookings`, and every `BookingResult.code` matches an API error code. Suggested order: auth → search → book → wallet → driver. Set an `NEXT_PUBLIC_API_URL`, add a small fetch client that attaches the bearer token and unwraps `{error}`, then replace each store action's body with a call, keeping the typed results.
