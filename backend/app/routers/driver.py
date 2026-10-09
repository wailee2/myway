from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import policy
from .. import services as svc
from ..db import get_db, utcnow
from ..errors import ApiError
from ..models import Booking, LedgerEntry, Route, Trip, User, Vehicle
from ..security import require_role

router = APIRouter(prefix="/driver", tags=["driver"])
driver = require_role("driver")


class NewTrip(BaseModel):
    route_id: str
    departs_at: datetime  # UTC
    price: int = Field(ge=500, le=5000)  # all-in back-seat fare
    women_only: bool = False
    repeat_weekdays: bool = False  # never switched on silently


@router.post("/trips", status_code=201)
def post_trip(body: NewTrip, user: User = Depends(driver), db: Session = Depends(get_db)):
    if not user.id_verified:
        raise ApiError("ID_REQUIRED", "Finish ID verification before posting trips.", 403)
    if not db.get(Route, body.route_id):
        raise ApiError("NO_SELECTION", "Choose a route.", 422)
    when = body.departs_at.replace(tzinfo=None)
    if when <= utcnow():
        raise ApiError("INVALID_INPUT", "Choose a departure time in the future.", 422)
    vehicle = db.scalar(select(Vehicle).where(Vehicle.driver_id == user.id))
    if not vehicle:
        raise ApiError("INVALID_INPUT", "Add your vehicle before posting a trip.", 422)
    t = Trip(route_id=body.route_id, driver_id=user.id, vehicle_id=vehicle.id, departs_at=when, price=body.price,
             women_only=body.women_only, repeat_rule="weekdays" if body.repeat_weekdays else None)
    db.add(t)
    db.commit()
    return svc.trip_out(t, [])


def _mine(db: Session, user: User, trip_id: str) -> Trip:
    t = db.get(Trip, trip_id)
    if not t or t.driver_id != user.id:
        raise ApiError("NOT_FOUND", "We can't find that trip.", 404)
    return t


def _live(db: Session, trip_id: str) -> list[Booking]:
    return list(db.scalars(select(Booking).where(Booking.trip_id == trip_id, Booking.status == "upcoming")).unique())


def _rider_out(b: Booking) -> dict:
    return {"booking_id": b.id, "name": b.rider.name, "seat": b.seat, "pickup_stop": b.pickup_stop, "dropoff_stop": b.dropoff_stop,
            "boarded": b.progress == "boarded", "progress": b.progress, "price_paid": b.price_paid}


@router.get("/trips")
def my_trips(user: User = Depends(driver), db: Session = Depends(get_db)):
    rows = db.scalars(select(Trip).where(Trip.driver_id == user.id).order_by(Trip.departs_at.desc()).limit(30)).unique()
    return [{**svc.trip_out(t, svc.taken_seats(db, t.id)), "riders": [_rider_out(b) for b in _live(db, t.id)]} for t in rows]


@router.get("/trips/{trip_id}")
def trip_detail(trip_id: str, user: User = Depends(driver), db: Session = Depends(get_db)):
    t = _mine(db, user, trip_id)
    live = _live(db, t.id)
    return {**svc.trip_out(t, svc.taken_seats(db, t.id)), "riders": [_rider_out(b) for b in live],
            "expected_earnings": sum(svc.driver_share(b.price_paid) for b in live)}


class Progress(BaseModel):
    progress: str  # on_the_way | arriving


@router.post("/trips/{trip_id}/progress")
def set_progress(trip_id: str, body: Progress, user: User = Depends(driver), db: Session = Depends(get_db)):
    """Driver is on the way / arriving: updates every live rider who hasn't boarded."""
    if body.progress not in ("on_the_way", "arriving"):
        raise ApiError("INVALID_INPUT", "Progress must be on_the_way or arriving.", 422)
    t = _mine(db, user, trip_id)
    n = 0
    for b in _live(db, t.id):
        if b.progress in ("assigned", "on_the_way", "arriving"):
            b.progress, b.late_minutes = body.progress, None
            n += 1
    db.commit()
    return {"updated": n}


class Late(BaseModel):
    minutes: int = Field(ge=1, le=120)


@router.post("/trips/{trip_id}/late")
def running_late(trip_id: str, body: Late, user: User = Depends(driver), db: Session = Depends(get_db)):
    t = _mine(db, user, trip_id)
    for b in _live(db, t.id):
        if b.progress != "boarded":
            b.late_minutes = body.minutes
    db.commit()
    return {"ok": True}


class Board(BaseModel):
    code: str = Field(min_length=4, max_length=4)


@router.post("/trips/{trip_id}/board")
def board(trip_id: str, body: Board, user: User = Depends(driver), db: Session = Depends(get_db)):
    t = _mine(db, user, trip_id)
    b = next((x for x in _live(db, t.id) if x.boarding_code == body.code), None)
    if not b:
        raise ApiError("NO_MATCH", "That code doesn't match a rider on this trip. Check the 4 digits and try again.", 404)
    if b.progress == "boarded":
        raise ApiError("ALREADY_BOARDED", f"{b.rider.name} is already on board.", 409)
    b.progress, b.late_minutes = "boarded", None
    db.commit()
    return {"name": b.rider.name, "seat": b.seat}


@router.post("/trips/{trip_id}/bookings/{booking_id}/no-show")
def no_show(trip_id: str, booking_id: str, user: User = Depends(driver), db: Session = Depends(get_db)):
    """Seat released, fare NOT refunded, driver still paid at completion (see policy)."""
    t = _mine(db, user, trip_id)
    b = db.get(Booking, booking_id)
    if not b or b.trip_id != t.id or b.status != "upcoming" or b.progress == "boarded":
        raise ApiError("NOT_FOUND", "We can't find that rider.", 404)
    if (utcnow() - svc.stop_time(t, b.pickup_stop)).total_seconds() < policy.NO_SHOW_WAIT_MINUTES * 60 and not t.status == "started":
        raise ApiError("INVALID_INPUT", f"Wait at least {policy.NO_SHOW_WAIT_MINUTES} minutes at the stop before marking a no-show.", 409)
    b.status, b.cancelled_by = "cancelled", "no_show"
    if b.payment == "wallet":
        svc.credit(db, user.id, svc.driver_share(b.price_paid), "earning", booking_id=b.id, note="No-show fare")
    db.commit()
    return {"ok": True}


@router.post("/trips/{trip_id}/start")
def start(trip_id: str, user: User = Depends(driver), db: Session = Depends(get_db)):
    t = _mine(db, user, trip_id)
    if t.status != "scheduled" or not any(b.progress == "boarded" for b in _live(db, t.id)):
        raise ApiError("INVALID_INPUT", "Verify at least one rider before starting.", 409)
    t.status = "started"
    db.commit()
    return {"status": t.status}


@router.post("/trips/{trip_id}/complete")
def complete(trip_id: str, user: User = Depends(driver), db: Session = Depends(get_db)):
    """Boarded riders are dropped off; riders who never boarded are no-shows. The driver earns the fare minus
    commission for every prepaid seat, including no-shows."""
    t = _mine(db, user, trip_id)
    if t.status != "started":
        raise ApiError("INVALID_INPUT", "Start the trip first.", 409)
    earned = 0
    for b in _live(db, t.id):
        if b.progress == "boarded":
            b.progress, b.status = "dropped_off", "completed"
        else:
            b.status, b.cancelled_by = "cancelled", "no_show"
        if b.payment == "wallet":
            share = svc.driver_share(b.price_paid)
            svc.credit(db, user.id, share, "earning", booking_id=b.id, note=f"Fare · {t.route.name}")
            earned += share
    t.status = "completed"
    db.commit()
    return {"earned": earned}


@router.post("/trips/{trip_id}/cancel")
def cancel_trip(trip_id: str, user: User = Depends(driver), db: Session = Depends(get_db)):
    """Driver cancels: every rider is refunded in full automatically."""
    t = _mine(db, user, trip_id)
    if t.status not in ("scheduled",):
        raise ApiError("INVALID_INPUT", "This trip can't be cancelled now.", 409)
    refunded = 0
    for b in _live(db, t.id):
        b.status, b.cancelled_by = "cancelled", "driver"
        svc.credit(db, b.rider_id, b.charged, "refund", booking_id=b.id, note="Refund · driver cancelled")
        refunded += b.charged
    t.status = "cancelled_by_driver"
    db.commit()
    return {"riders_refunded": refunded}


@router.get("/earnings")
def earnings(user: User = Depends(driver), db: Session = Depends(get_db)):
    q = lambda *c: db.scalar(select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.user_id == user.id, *c)) or 0  # noqa: E731
    net = q(LedgerEntry.kind == "earning")
    return {"balance": svc.balance(db, user.id), "net_earned": net, "tips": q(LedgerEntry.kind == "tip"),
            "gross_fares": round(net / (1 - policy.COMMISSION_RATE)) if net else 0, "commission_rate": policy.COMMISSION_RATE}


class Withdraw(BaseModel):
    amount: int = Field(gt=0)
    bank: str
    account_number: str = Field(pattern=r"^\d{10}$")


@router.post("/withdraw", status_code=201)
def withdraw(body: Withdraw, user: User = Depends(driver), db: Session = Depends(get_db)):
    """Debits the ledger. TODO(payments): trigger the real bank transfer with the provider; until then the payout is 'queued'."""
    if body.amount < policy.MIN_WITHDRAWAL:
        raise ApiError("INVALID_INPUT", f"The minimum withdrawal is ₦{policy.MIN_WITHDRAWAL:,}.", 422)
    svc.lock_user(db, user.id)
    start = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today = db.scalar(select(func.count()).select_from(LedgerEntry).where(LedgerEntry.user_id == user.id, LedgerEntry.kind == "payout", LedgerEntry.created_at >= start)) or 0
    fee = policy.EXTRA_WITHDRAWAL_FEE if today >= policy.FREE_WITHDRAWALS_PER_DAY else 0
    if body.amount + fee > svc.balance(db, user.id):
        raise ApiError("INSUFFICIENT_FUNDS", "That's more than your available balance.", 402)
    svc.credit(db, user.id, -body.amount, "payout", note=f"Withdrawal · {body.bank} ••{body.account_number[-4:]}")
    if fee:
        svc.credit(db, user.id, -fee, "fee", note="Extra withdrawal fee")
    db.commit()
    return {"status": "queued", "amount": body.amount, "fee": fee, "balance": svc.balance(db, user.id)}
