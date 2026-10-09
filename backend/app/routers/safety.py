import secrets

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..errors import ApiError
from ..models import Booking, Report, RouteRequest, SavedRoute, SosEvent, Stop, TrustedContact, User
from ..security import current_user
from .. import services as svc

router = APIRouter(tags=["safety"])

CATEGORIES = ["Driver was late", "Unsafe driving", "Couldn't find the pickup", "Vehicle issue", "Behaviour or safety concern", "Payment or refund", "Other"]


# ------------------------------- trusted contacts -------------------------------
class Contact(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    phone: str = Field(pattern=r"^[789]\d{9}$")


@router.get("/safety/contacts")
def contacts(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "phone": c.phone} for c in db.scalars(select(TrustedContact).where(TrustedContact.user_id == user.id))]


@router.post("/safety/contacts", status_code=201)
def add_contact(body: Contact, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = TrustedContact(user_id=user.id, name=body.name.strip(), phone=body.phone)
    db.add(c)
    db.commit()
    return {"id": c.id, "name": c.name, "phone": c.phone}


@router.delete("/safety/contacts/{cid}", status_code=204)
def remove_contact(cid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = db.get(TrustedContact, cid)
    if not c or c.user_id != user.id:
        raise ApiError("NOT_FOUND", "We can't find that contact.", 404)
    db.delete(c)
    db.commit()


# ------------------------------- reports and SOS -------------------------------
class NewReport(BaseModel):
    category: str
    details: str = Field(default="", max_length=2000)
    booking_id: str | None = None


@router.post("/reports", status_code=201)
def file_report(body: NewReport, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Creates a record with a reference the rider can quote. A person must read the queue: see docs/DATA_PROTECTION_AND_SUPPORT.md."""
    if body.category not in CATEGORIES:
        raise ApiError("INVALID_INPUT", "Choose what went wrong.", 422)
    if body.booking_id:
        b = db.get(Booking, body.booking_id)
        if not b or user.id not in (b.rider_id, b.trip.driver_id):
            raise ApiError("NOT_FOUND", "We can't find that booking.", 404)
    for _ in range(5):
        r = Report(ref=f"MW-{secrets.randbelow(9000) + 1000}", user_id=user.id, booking_id=body.booking_id, category=body.category, details=body.details.strip())
        db.add(r)
        try:
            db.commit()
            break
        except IntegrityError:  # reference collision: try another
            db.rollback()
    else:
        raise ApiError("UNAVAILABLE", "Couldn't file your report. Try again.", 503)
    return {"ref": r.ref, "status": r.status, "created_at": svc.iso(r.created_at)}


@router.get("/reports")
def my_reports(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Report).where(Report.user_id == user.id).order_by(Report.created_at.desc()))
    return [{"ref": r.ref, "category": r.category, "status": r.status, "created_at": svc.iso(r.created_at)} for r in rows]


class Sos(BaseModel):
    booking_id: str | None = None
    lat: float | None = None
    lng: float | None = None


@router.post("/sos", status_code=201)
def sos(body: Sos, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Records the alert. It is only useful if someone is watching the queue and `acknowledged` is shown to the rider:
    we return acknowledged=False and never claim a response we can't guarantee. TODO(ops): notify the support desk + contacts."""
    e = SosEvent(user_id=user.id, booking_id=body.booking_id, lat=body.lat, lng=body.lng)
    db.add(e)
    db.commit()
    return {"id": e.id, "recorded": True, "acknowledged": False, "emergency_number": "112"}


# ------------------------------- usual routes + route requests -------------------------------
class Usual(BaseModel):
    from_stop: str
    to_stop: str
    days: list[int] = Field(min_length=1)
    time_of_day: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


def _usual_out(u: SavedRoute) -> dict:
    return {"id": u.id, "from_stop": u.from_stop, "to_stop": u.to_stop, "days": u.days, "time_of_day": u.time_of_day}


@router.get("/usual-routes")
def usual(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [_usual_out(u) for u in db.scalars(select(SavedRoute).where(SavedRoute.user_id == user.id))]


@router.put("/usual-routes")
def save_usual(body: Usual, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Upsert by (from, to)."""
    if not all(0 <= d <= 6 for d in body.days) or body.from_stop == body.to_stop or not db.get(Stop, body.from_stop) or not db.get(Stop, body.to_stop):
        raise ApiError("INVALID_INPUT", "Choose two different stops and valid days.", 422)
    u = db.scalar(select(SavedRoute).where(SavedRoute.user_id == user.id, SavedRoute.from_stop == body.from_stop, SavedRoute.to_stop == body.to_stop))
    if u:
        u.days, u.time_of_day = sorted(set(body.days)), body.time_of_day
    else:
        u = SavedRoute(user_id=user.id, from_stop=body.from_stop, to_stop=body.to_stop, days=sorted(set(body.days)), time_of_day=body.time_of_day)
        db.add(u)
    db.commit()
    return _usual_out(u)


@router.delete("/usual-routes/{uid}", status_code=204)
def delete_usual(uid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    u = db.get(SavedRoute, uid)
    if not u or u.user_id != user.id:
        raise ApiError("NOT_FOUND", "We can't find that route.", 404)
    db.delete(u)
    db.commit()


class RouteAsk(BaseModel):
    from_text: str = Field(min_length=2, max_length=120)
    to_text: str = Field(min_length=2, max_length=120)
    days: list[int] = []
    time_text: str = ""


@router.post("/route-requests", status_code=201)
def request_route(body: RouteAsk, user: User = Depends(current_user), db: Session = Depends(get_db)):
    r = RouteRequest(user_id=user.id, from_text=body.from_text.strip(), to_text=body.to_text.strip(), days=body.days, time_text=body.time_text)
    db.add(r)
    db.commit()
    return {"id": r.id}
