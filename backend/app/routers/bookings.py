from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import secrets

from .. import policy
from .. import services as svc
from ..db import get_db, utcnow
from ..errors import ApiError
from ..models import Booking, Message, Stop, Trip, User
from ..security import current_user, require_role

router = APIRouter(tags=["bookings"])


class NewBooking(BaseModel):
    trip_id: str
    seat: str
    pickup_stop: str
    dropoff_stop: str
    payment: str = "wallet"  # wallet | cash. card/transfer wait for the payment provider.


@router.post("/bookings", status_code=201)
def create_booking(body: NewBooking, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    if not user.id_verified:
        raise ApiError("ID_REQUIRED", "Confirm your ID to reserve your first seat.", 403)
    trip = db.get(Trip, body.trip_id)
    if not trip or trip.status != "scheduled":
        raise ApiError("NO_TRIP", "That ride is no longer available. Choose another ride.", 404)
    if trip.driver_id == user.id:
        raise ApiError("NO_SELECTION", "You can't book a seat on your own trip.", 422)
    ids = svc.stop_ids(trip.route)
    if body.seat not in policy.SEATS or body.pickup_stop not in ids or body.dropoff_stop not in ids or ids.index(body.pickup_stop) >= ids.index(body.dropoff_stop):
        raise ApiError("NO_SELECTION", "Choose a valid seat, pickup and drop-off for this trip.", 422)
    if not db.get(Stop, body.pickup_stop).pickup_allowed or not db.get(Stop, body.dropoff_stop).dropoff_allowed:
        raise ApiError("NO_SELECTION", "That stop isn't available for pickup or drop-off.", 422)
    if svc.stop_time(trip, body.pickup_stop) <= utcnow():
        raise ApiError("NO_TRIP", "That ride has already left. Choose another ride.", 409)
    if body.payment not in ("wallet", "cash"):
        raise ApiError("UNAVAILABLE", "Card and bank-transfer payments aren't connected yet. Pay from your wallet.", 400)

    fare = svc.fare_for(trip, body.seat)
    charge = fare if body.payment == "wallet" else policy.CASH_HOLD
    svc.lock_user(db, user.id)
    bal = svc.balance(db, user.id)
    if charge > bal:
        raise ApiError("INSUFFICIENT_FUNDS", f"Your wallet is ₦{charge - bal:,} short.", 402, shortBy=charge - bal)

    booking = Booking(trip_id=trip.id, rider_id=user.id, seat=body.seat, pickup_stop=body.pickup_stop, dropoff_stop=body.dropoff_stop,
                      price_paid=fare, charged=charge, payment=body.payment, boarding_code=f"{secrets.randbelow(10000):04d}")
    db.add(booking)
    try:
        db.flush()  # the unique "live seat" index decides who wins a race
    except IntegrityError:
        db.rollback()
        raise ApiError("SEAT_TAKEN", "Someone just reserved that seat. Choose another seat.", 409)
    svc.credit(db, user.id, -charge, "ride" if body.payment == "wallet" else "hold", booking_id=booking.id,
               note=f"Ride on {trip.route.name}" if body.payment == "wallet" else "Seat hold · cash trip")
    db.commit()
    db.refresh(booking)
    return svc.booking_out(booking)


@router.get("/bookings")
def my_bookings(user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    rows = db.scalars(select(Booking).where(Booking.rider_id == user.id).order_by(Booking.created_at.desc())).unique()
    return [svc.booking_out(b) for b in rows]


def _own(db: Session, user: User, booking_id: str) -> Booking:
    b = db.get(Booking, booking_id)
    if not b or b.rider_id != user.id:
        raise ApiError("NOT_FOUND", "We can't find that booking.", 404)
    return b


@router.get("/bookings/{booking_id}")
def get_booking(booking_id: str, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    return svc.booking_out(_own(db, user, booking_id))


@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: str, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    b = _own(db, user, booking_id)
    if b.status != "upcoming" or b.progress in ("boarded", "dropped_off"):
        raise ApiError("INVALID_INPUT", "This seat can't be cancelled any more.", 409)
    free = svc.minutes_until_pickup(b) >= policy.CANCEL_FREE_MINUTES
    b.status, b.cancelled_by = "cancelled", "rider"
    refund = b.charged if free else 0
    if refund:
        svc.credit(db, user.id, refund, "refund", booking_id=b.id, note="Refund · cancelled seat")
    db.commit()
    return {**svc.booking_out(b), "refunded": refund}


class Rating(BaseModel):
    stars: int = Field(ge=1, le=5)
    tags: list[str] = []
    tip: int = Field(default=0, ge=0, le=5000)


@router.post("/bookings/{booking_id}/rate")
def rate(booking_id: str, body: Rating, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    b = _own(db, user, booking_id)
    if b.progress != "dropped_off" or b.rating is not None:
        raise ApiError("INVALID_INPUT", "You can rate a ride once, after you've arrived.", 409)
    tip = 0
    if body.tip:
        svc.lock_user(db, user.id)
        if body.tip > svc.balance(db, user.id):
            raise ApiError("INSUFFICIENT_FUNDS", "Your wallet can't cover that tip.", 402, shortBy=body.tip - svc.balance(db, user.id))
        tip = body.tip
        svc.credit(db, user.id, -tip, "tip", booking_id=b.id, note="Tip for your driver")
        svc.credit(db, b.trip.driver_id, tip, "tip", booking_id=b.id, note="Tip from a rider")  # tips go 100% to the driver
    b.rating, b.rating_tags, b.tip = body.stars, body.tags[:6], tip
    db.commit()
    return svc.booking_out(b)


class Msg(BaseModel):
    text: str = Field(min_length=1, max_length=200)


def _can_talk(b: Booking) -> bool:
    """Messaging is open while the booking is live, and for 30 minutes after drop-off."""
    if b.status == "upcoming":
        return True
    return b.progress == "dropped_off" and (utcnow() - b.updated_at).total_seconds() <= 30 * 60


@router.get("/bookings/{booking_id}/messages")
def messages(booking_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    b = db.get(Booking, booking_id)
    if not b or user.id not in (b.rider_id, b.trip.driver_id):
        raise ApiError("NOT_FOUND", "We can't find that booking.", 404)
    rows = db.scalars(select(Message).where(Message.booking_id == b.id).order_by(Message.created_at))
    return [{"id": m.id, "from": m.sender, "text": m.text, "at": svc.iso(m.created_at)} for m in rows]


@router.post("/bookings/{booking_id}/messages", status_code=201)
def send_message(booking_id: str, body: Msg, user: User = Depends(current_user), db: Session = Depends(get_db)):
    b = db.get(Booking, booking_id)
    if not b or user.id not in (b.rider_id, b.trip.driver_id):
        raise ApiError("NOT_FOUND", "We can't find that booking.", 404)
    if not _can_talk(b):
        raise ApiError("FORBIDDEN", "Messaging has closed for this trip.", 403)
    m = Message(booking_id=b.id, sender="rider" if user.id == b.rider_id else "driver", text=body.text.strip())
    db.add(m)
    db.commit()
    return {"id": m.id, "from": m.sender, "text": m.text, "at": svc.iso(m.created_at)}
