"""Domain logic shared by routers: ledger, matching, serialisation."""
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, object_session

from . import policy
from .db import utcnow
from .geo import distance_m
from .models import Booking, LedgerEntry, Route, Stop, Trip, User


# ------------------------------- wallet -------------------------------
def balance(db: Session, user_id: str) -> int:
    return db.scalar(select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.user_id == user_id)) or 0


def lock_user(db: Session, user_id: str) -> None:
    """Serialises concurrent spends by the same user on Postgres (SELECT … FOR UPDATE). A no-op on SQLite,
    which already serialises writers."""
    db.execute(select(User.id).where(User.id == user_id).with_for_update())


def credit(db: Session, user_id: str, amount: int, kind: str, *, booking_id: str | None = None, note: str = "", external_ref: str | None = None) -> None:
    db.add(LedgerEntry(user_id=user_id, amount=amount, kind=kind, booking_id=booking_id, note=note, external_ref=external_ref))


def driver_share(fare: int) -> int:
    return round(fare * (1 - policy.COMMISSION_RATE))


# ------------------------------- routes and matching -------------------------------
def stop_ids(route: Route) -> list[str]:
    return [rs.stop_id for rs in route.stops]


def route_minutes(route: Route, stop_id: str) -> int:
    return next(rs.minutes for rs in route.stops if rs.stop_id == stop_id)


def stop_time(trip: Trip, stop_id: str) -> datetime:
    return trip.departs_at + timedelta(minutes=route_minutes(trip.route, stop_id))


def fare_for(trip: Trip, seat: str) -> int:
    return trip.price + (policy.FRONT_SEAT_PREMIUM if seat == "front" else 0)


def taken_seats(db: Session, trip_id: str) -> list[str]:
    rows = db.scalars(select(Booking.seat).where(Booking.trip_id == trip_id, Booking.status != "cancelled"))
    return sorted(set(rows), key=policy.SEATS.index)


def _candidates(route: Route, wanted: Stop, kind: str, stops: dict[str, Stop]):
    out = []
    for rs in route.stops:
        s = stops[rs.stop_id]
        if not (s.pickup_allowed if kind == "pickup" else s.dropoff_allowed):
            continue
        if s.id == wanted.id:
            d = 0.0
        elif s.area_id == wanted.area_id:
            d = distance_m(s.lat, s.lng, wanted.lat, wanted.lng)
        else:
            continue
        if d <= policy.NEAR_STOP_METRES:
            out.append((s, d))
    return out


def match_trips(db: Session, from_id: str, to_id: str, day_start: datetime, day_end: datetime):
    """Trips on [day_start, day_end) (UTC) that take the rider from `from` to `to`, exact or within walking range
    in the same area. Returns dicts ready for the API."""
    stops = {s.id: s for s in db.scalars(select(Stop))}
    a, b = stops.get(from_id), stops.get(to_id)
    if not a or not b or a.id == b.id:
        return []
    trips = db.scalars(select(Trip).where(Trip.status == "scheduled", Trip.departs_at >= day_start, Trip.departs_at < day_end).order_by(Trip.departs_at)).unique()
    out = []
    for t in trips:
        ids = stop_ids(t.route)
        best = None
        for p, pd in _candidates(t.route, a, "pickup", stops):
            for d, dd in _candidates(t.route, b, "dropoff", stops):
                if ids.index(p.id) >= ids.index(d.id):
                    continue
                if best is None or pd + dd < best[2] + best[3]:
                    best = (p, d, pd, dd)
        if not best:
            continue
        p, d, pd, dd = best
        taken = taken_seats(db, t.id)
        out.append({"trip": t, "pickup": p, "dropoff": d, "pickup_offset_m": round(pd), "dropoff_offset_m": round(dd),
                    "pickup_time": stop_time(t, p.id), "dropoff_time": stop_time(t, d.id), "taken": taken, "seats_left": policy.MAX_SEATS - len(taken)})
    return out


def minutes_until_pickup(b: Booking, now: datetime | None = None) -> float:
    return (stop_time(b.trip, b.pickup_stop) - (now or utcnow())).total_seconds() / 60


# ------------------------------- serialisation -------------------------------
def iso(dt: datetime) -> str:
    return dt.isoformat() + "Z"


def driver_stats(db: Session, driver_id: str) -> dict:
    """Average rating (None until someone has rated) and completed-trip count, computed from real bookings."""
    avg, n = db.execute(select(func.avg(Booking.rating), func.count(Booking.rating)).join(Trip, Booking.trip_id == Trip.id)
                        .where(Trip.driver_id == driver_id, Booking.rating.is_not(None))).one()
    trips = db.scalar(select(func.count()).select_from(Trip).where(Trip.driver_id == driver_id, Trip.status == "completed")) or 0
    return {"rating": round(float(avg), 1) if avg else None, "ratings": n, "trips": trips}


def trip_out(t: Trip, taken: list[str], db: Session | None = None) -> dict:
    return {
        "id": t.id, "route_id": t.route_id, "route_name": t.route.name, "departs_at": iso(t.departs_at), "price": t.price,
        "women_only": t.women_only, "status": t.status, "taken": taken, "seats_left": policy.MAX_SEATS - len(taken),
        "driver": {"id": t.driver_id, "name": t.driver.name, "id_verified": t.driver.id_verified, **(driver_stats(db, t.driver_id) if db else {})},
        "vehicle": {"plate": t.vehicle.plate, "make": t.vehicle.make, "color": t.vehicle.color},
        "stops": [{"stop_id": rs.stop_id, "minutes": rs.minutes, "km": rs.km, "time": iso(t.departs_at + timedelta(minutes=rs.minutes))} for rs in t.route.stops],
    }


def booking_out(b: Booking, *, for_rider: bool = True) -> dict:
    t = b.trip
    db = object_session(b)
    out = {
        "id": b.id, "trip_id": b.trip_id, "seat": b.seat, "pickup_stop": b.pickup_stop, "dropoff_stop": b.dropoff_stop,
        "pickup_time": iso(stop_time(t, b.pickup_stop)), "dropoff_time": iso(stop_time(t, b.dropoff_stop)),
        "price_paid": b.price_paid, "payment": b.payment, "status": b.status, "progress": b.progress,
        "cancelled_by": b.cancelled_by, "late_minutes": b.late_minutes, "rating": b.rating, "tip": b.tip,
        "created_at": iso(b.created_at), "updated_at": iso(b.updated_at),
        "driver": {"id": t.driver_id, "name": t.driver.name, "plate": t.vehicle.plate, "make": t.vehicle.make, "color": t.vehicle.color,
                   "id_verified": t.driver.id_verified, **(driver_stats(db, t.driver_id) if db else {})},
        "route_name": t.route.name,
        # Enough of the trip for a client to show the booking on its own (no second request needed).
        "route_id": t.route_id, "departs_at": iso(t.departs_at), "trip_price": t.price, "women_only": t.women_only,
        "taken": taken_seats(db, t.id) if db else [],
    }
    if for_rider:
        out["boarding_code"] = b.boarding_code  # only the rider sees their code
    return out
