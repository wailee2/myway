from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db, lagos_today, utcnow
from ..errors import ApiError
from ..models import Area, Route, Stop, Trip
from .. import services as svc
from ..seed import ensure_soon_trips

router = APIRouter(tags=["catalog"])


def stop_out(s: Stop) -> dict:
    return {"id": s.id, "name": s.name, "area_id": s.area_id, "landmark": s.landmark, "lat": s.lat, "lng": s.lng,
            "pickup_allowed": s.pickup_allowed, "dropoff_allowed": s.dropoff_allowed, "aliases": s.aliases}


@router.get("/areas")
def areas(db: Session = Depends(get_db)):
    return [{"id": a.id, "name": a.name} for a in db.scalars(select(Area).order_by(Area.name))]


@router.get("/stops")
def stops(q: str = "", db: Session = Depends(get_db)):
    """All stops, or those matching a name, landmark, area or alias ('Jabi' lists every Jabi stop)."""
    areas_ = {a.id: a.name for a in db.scalars(select(Area))}
    q = q.strip().lower()
    out = []
    for s in db.scalars(select(Stop).order_by(Stop.name)):
        hay = [s.name, s.landmark, areas_.get(s.area_id, ""), *s.aliases]
        if not q or any(q in h.lower() for h in hay):
            out.append({**stop_out(s), "area": areas_.get(s.area_id, "")})
    return out


@router.get("/routes")
def routes(db: Session = Depends(get_db)):
    return [{"id": r.id, "name": r.name, "stops": [{"stop_id": x.stop_id, "minutes": x.minutes, "km": x.km} for x in r.stops]} for r in db.scalars(select(Route))]


@router.get("/rides")
def search_rides(from_: str = Query(alias="from"), to: str = Query(), day: int = Query(0, ge=0, le=6),
                 include_departed: bool = False, db: Session = Depends(get_db)):
    """Rides from stop `from` to stop `to` on `day` (0 = today, Lagos time). Departed trips are hidden."""
    if settings.demo and day == 0:
        ensure_soon_trips(db)  # demo only: so "today" always has rides, whatever the hour
    start_local = lagos_today().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=day)
    start = (start_local - timedelta(hours=1)).replace(tzinfo=None)
    matches = svc.match_trips(db, from_, to, start, start + timedelta(days=1))
    now = utcnow()
    out = []
    for m in matches:
        if m["pickup_time"] <= now and not (include_departed and settings.demo):
            continue
        out.append({
            "trip": svc.trip_out(m["trip"], m["taken"], db),
            "pickup": {"id": m["pickup"].id, "name": m["pickup"].name, "offset_m": m["pickup_offset_m"], "time": svc.iso(m["pickup_time"])},
            "dropoff": {"id": m["dropoff"].id, "name": m["dropoff"].name, "offset_m": m["dropoff_offset_m"], "time": svc.iso(m["dropoff_time"])},
            "seats_left": m["seats_left"],
        })
    return {"results": out, "count": len(out)}


@router.get("/trips/{trip_id}")
def trip(trip_id: str, db: Session = Depends(get_db)):
    t = db.get(Trip, trip_id)
    if not t:
        raise ApiError("NO_TRIP", "That ride is no longer available.", 404)
    return svc.trip_out(t, svc.taken_seats(db, t.id), db)
