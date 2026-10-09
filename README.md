# MYWAY

Seat-booked shared rides and scheduled buses for Abuja. One repo, two apps:

| Folder | What | Port |
|---|---|---|
| `frontend/` | Next.js 16 app (rider, driver, operator) | 3000 |
| `backend/` | FastAPI + SQLAlchemy API (SQLite in dev) | 8000 |

## Run it
Needs Node 20.9+ and Python 3.10+.

```bash
npm run setup   # once: backend venv + pip install, frontend npm install, creates .env files
npm run dev     # starts API and web together; Ctrl+C stops both
npm test        # backend pytest + frontend typecheck
```

- App: http://localhost:3000  ·  API docs: http://localhost:8000/docs
- Demo sign-in (code `123456`): rider `8011111111`, driver `8022222222`, operator `8033333333`.
- The browser calls same-origin `/api/*`; Next forwards it to FastAPI (`frontend/next.config.ts`, `API_URL`). `frontend/lib/api/client.ts` is the fetch client (bearer token, typed errors).

## Current state: read this
**Rider app: wired to the backend** (everything below is saved in `backend/myway.db`):
- Log in, sign up, ID check.
- Search (real trips and seats), trip details, seat choice, checkout (wallet or cash hold), My trips, booking page, cancel with the real refund rules, rating and tip, messages with the driver.
- Wallet balance and history, top-ups (pending until "confirmed"; in demo mode use the "simulate bank confirmation" button).
- The app re-reads bookings and the wallet every 15 seconds and when you return to the tab.
- Demo helpers: the demo rider (`8011111111`) starts with ₦8,400; "Today" always has rides; the "Demo: move the trip along" chips call demo-only backend endpoints (`/dev/bookings/...`) so you can walk a booking through on-the-way, boarded, dropped-off, late, driver-cancel and no-show without a driver app.

**Still on local demo data in the browser:** the driver app, the operator app, bus tickets and commuter passes (their purchase buttons are disabled with a notice while the backend is on), safety contacts/SOS/reports, usual routes, route requests and notifications. The backend already has endpoints for the driver app, safety and usual routes; they just aren't connected yet.

Card and bank-transfer checkout are hidden (the backend only takes wallet and cash-hold payments until a payment provider is added).

Set `NEXT_PUBLIC_LIVE_API=false` in `frontend/.env.local` to run the frontend alone with the old all-local behaviour. Demo sign-in code with the backend is `123456`.

Backend open items (SMS delivery, payments, real ID checks, migrations) are listed in `backend/README.md`.

Contributors List


Name| Email| GitHub Username
|---|---|---|
Abdulrahman Suleiman Adama| shabduladama@gmail.com| @
Abdulrahman Yusufu| yabdrahmanyus@gmail.com| 
Ayeni Oluwaferanmi| 9fernni@gmail.com| @wailee2
Oladele Jamiu Adeyemi| jamiuoladele70@gmail.com| 
Oni Omotoyosi Roseline| Onitoyosi51@gmail.com| 
Umoren Comfort Johnson| com4ortumoren@gmail.com| @Com4ort
Yusuf Sada| malamiyusuf1@gmail.com| @Axzia