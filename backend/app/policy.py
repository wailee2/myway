"""Business rules. PROVISIONAL, mirrors lib/policy.ts on the frontend and docs/DECISIONS.md.
Change them in both places once the supervisor signs the decisions sheet."""

CANCEL_FREE_MINUTES = 30
NO_SHOW_WAIT_MINUTES = 5
COMMISSION_RATE = 0.10
FRONT_SEAT_PREMIUM = 300
CASH_HOLD = 200
MIN_WITHDRAWAL = 1000
FREE_WITHDRAWALS_PER_DAY = 1
EXTRA_WITHDRAWAL_FEE = 50
MAX_SEATS = 4
NEAR_STOP_METRES = 600
SEATS = ("front", "back-l", "back-m", "back-r")
