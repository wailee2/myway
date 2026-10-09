"""DEMO ONLY (mounted only when DEMO=true). Lets a rider move their own trip along without a driver app:
the frontend's "Demo: move the trip along" chips call these. They do what the driver endpoints would do."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import services as svc
from ..config import settings
from ..db import get_db
from ..errors import ApiError
from ..models import Booking, User
from ..security import require_role

router = APIRouter(prefix="/dev/bookings", tags=["dev (demo only)"])
STEPS = ("assigned", "on_the_way", "arriving", "boarded", "dropped_off")


def _mine(db: Session, user: User, booking_id: str) -> Booking:
    b = db.get(Booking, booking_id)
    if not settings.demo or not b or b.rider_id != user.id:
        raise ApiError("NOT_FOUND", "We can't find that booking.", 404)
    if b.status != "upcoming":
        raise ApiError("INVALID_INPUT", "This booking is already finished.", 409)
    return b


def _pay_driver(db: Session, b: Booking, note: str) -> None:
    if b.payment == "wallet":
        svc.credit(db, b.trip.driver_id, svc.driver_share(b.price_paid), "earning", booking_id=b.id, note=note)


class Step(BaseModel):
    progress: str


@router.post("/{booking_id}/progress")
def progress(booking_id: str, body: Step, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    b = _mine(db, user, booking_id)
    if body.progress not in STEPS:
        raise ApiError("INVALID_INPUT", "Unknown step.", 422)
    b.progress, b.late_minutes = body.progress, None
    if body.progress == "dropped_off":
        b.status = "completed"
        _pay_driver(db, b, f"Fare · {b.trip.route.name}")
    db.commit()
    return svc.booking_out(b)


class Late(BaseModel):
    minutes: int = 10


@router.post("/{booking_id}/late")
def late(booking_id: str, body: Late, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    b = _mine(db, user, booking_id)
    b.late_minutes = body.minutes
    db.commit()
    return svc.booking_out(b)


@router.post("/{booking_id}/driver-cancel")
def driver_cancel(booking_id: str, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    b = _mine(db, user, booking_id)
    b.status, b.cancelled_by = "cancelled", "driver"
    svc.credit(db, b.rider_id, b.charged, "refund", booking_id=b.id, note="Refund · driver cancelled")
    db.commit()
    return svc.booking_out(b)


@router.post("/{booking_id}/no-show")
def no_show(booking_id: str, user: User = Depends(require_role("rider")), db: Session = Depends(get_db)):
    b = _mine(db, user, booking_id)
    b.status, b.cancelled_by = "cancelled", "no_show"
    _pay_driver(db, b, "No-show fare")
    db.commit()
    return svc.booking_out(b)
