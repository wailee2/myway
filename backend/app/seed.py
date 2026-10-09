"""Reference data (areas, stops, routes) always; demo users + trips only when settings.demo."""
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .db import LAGOS, lagos_today
from .db import utcnow
from .models import Area, LedgerEntry, Route, RouteStop, Stop, Trip, User, Vehicle

AREAS = [("nyanya", "Nyanya"), ("mararaba", "Mararaba"), ("asokoro", "Asokoro"), ("wuse", "Wuse"), ("jabi", "Jabi"), ("cbd", "Central Business District"),
         ("kubwa", "Kubwa"), ("gwarinpa", "Gwarinpa"), ("lugbe", "Lugbe"), ("garki", "Garki"), ("gwagwalada", "Gwagwalada"), ("jikwoyi", "Jikwoyi")]


def _geo(x: int, y: int) -> tuple[float, float]:
    # SEED coordinates derived from the frontend's illustrative map canvas: NOT surveyed GPS. Replace before launch.
    return round(9.1 - y * 0.00018, 5), round(7.3 + x * 0.00075, 5)


# id, area, name, landmark, x, y, pickup, dropoff, aliases
STOPS = [
    ("nyanya", "nyanya", "Nyanya Bridge stop", "Beside the footbridge, service-road side", 90, 400, True, True, ["Nyanya Bridge", "Nyanya Market", "Nyanya"]),
    ("mararaba", "mararaba", "Mararaba Junction", "Lay-by before the junction", 128, 300, True, True, ["Mararaba"]),
    ("aya", "asokoro", "AYA Roundabout", "Service lane before the roundabout", 200, 262, True, True, ["AYA", "Asokoro Extension"]),
    ("berger", "wuse", "Berger Junction", "Bus bay by the flyover", 250, 180, True, True, ["Berger", "Julius Berger yard", "Berger roundabout"]),
    ("cbd", "cbd", "CBD Terminal", "Terminal bay 2", 300, 130, True, True, ["CBD", "Central Area", "Three Arms Zone"]),
    ("kubwa", "kubwa", "Kubwa Expressway", "Expressway lay-by near the roundabout", 70, 150, True, True, ["Kubwa", "Kubwa Roundabout"]),
    ("gwarinpa", "gwarinpa", "Gwarinpa 1st Avenue", "Estate gate on 1st Avenue", 112, 172, True, True, ["Gwarinpa", "Gwarinpa Estate", "1st Avenue", "Kado"]),
    ("jabi-park", "jabi", "Jabi Motor Park", "Park gate on the service road", 163, 181, True, True, ["Jabi Park"]),
    ("jabi-mall", "jabi", "Jabi Lake Mall", "Main entrance car park", 168, 176, True, True, ["Jabi Lake", "Jabi mall", "Lake Mall"]),
    ("jabi-bridge", "jabi", "Jabi Under Bridge", "Lay-by under the bridge", 174, 183, False, True, ["Jabi Bridge", "Under bridge"]),
    ("wuse2", "wuse", "Wuse II", "Market gate on the main road", 230, 220, True, True, ["Wuse 2", "Wuse Zone 2", "Wuse Market", "Zone 4"]),
    ("lugbe", "lugbe", "Lugbe FHA", "FHA estate main gate", 60, 430, True, True, ["Lugbe", "FHA Lugbe"]),
    ("airport", "lugbe", "Airport Road Junction", "Junction lay-by, airport side", 150, 372, True, True, ["Airport Road", "Airport"]),
    ("garki", "garki", "Garki Area 1", "Area 1 shopping complex", 250, 300, True, True, ["Garki", "Area 1", "Garki Market"]),
    ("gwagwalada", "gwagwalada", "Gwagwalada Park", "Main motor park gate", 40, 340, True, True, ["Gwagwalada", "Gwag"]),
    ("jikwoyi", "jikwoyi", "Jikwoyi Gate", "Estate gate on the main road", 130, 420, True, True, ["Jikwoyi"]),
]

# route id, name, [(stop, minutes, km)]
ROUTES = [
    ("r-nyanya-cbd", "Nyanya → CBD", [("nyanya", 0, 0), ("mararaba", 8, 3.5), ("aya", 20, 9), ("berger", 32, 14), ("cbd", 45, 18)]),
    ("r-nyanya-jabi", "Nyanya → Jabi", [("nyanya", 0, 0), ("aya", 16, 9), ("berger", 30, 14), ("jabi-park", 38, 17), ("jabi-mall", 41, 18), ("jabi-bridge", 44, 19)]),
    ("r-cbd-nyanya", "CBD → Nyanya", [("cbd", 0, 0), ("berger", 12, 4), ("aya", 24, 9), ("nyanya", 45, 18)]),
    ("r-kubwa-wuse", "Kubwa → Wuse II", [("kubwa", 0, 0), ("gwarinpa", 14, 9), ("jabi-mall", 34, 18), ("wuse2", 50, 24)]),
    ("r-gwarinpa-wuse", "Gwarinpa → Wuse II", [("gwarinpa", 0, 0), ("jabi-park", 12, 6), ("jabi-mall", 16, 7), ("wuse2", 30, 12)]),
    ("r-lugbe-garki", "Lugbe → Garki", [("lugbe", 0, 0), ("airport", 14, 7), ("garki", 40, 14)]),
    ("r-gwagwalada-cbd", "Gwagwalada → CBD", [("gwagwalada", 0, 0), ("cbd", 70, 48)]),
]

DEMO_DRIVERS = [  # key, name, phone, plate, make, color
    ("d1", "Ade Okafor", "8022222222", "ABJ 482 KJ", "Toyota Corolla", "White"),
    ("d2", "Chioma Eze", "8044444441", "ABJ 190 LM", "Honda Accord", "Silver"),
    ("d3", "Musa Ibrahim", "8044444442", "ABJ 733 RT", "Toyota Camry", "Black"),
    ("d4", "Ngozi Obi", "8044444443", "ABJ 215 QW", "Kia Rio", "White"),
]
# route, local departure, price (all-in, back seat), driver, women_only
DEMO_TRIPS = [
    ("r-nyanya-cbd", "07:10", 1350, "d1", False), ("r-nyanya-cbd", "07:25", 1350, "d2", True), ("r-nyanya-cbd", "07:40", 1250, "d3", False),
    ("r-nyanya-jabi", "07:15", 1450, "d4", False), ("r-nyanya-jabi", "07:50", 1450, "d1", False),
    ("r-kubwa-wuse", "07:30", 1650, "d3", False), ("r-kubwa-wuse", "08:00", 1650, "d4", True),
    ("r-gwarinpa-wuse", "07:20", 1050, "d2", False), ("r-gwarinpa-wuse", "08:05", 1050, "d3", False),
    ("r-lugbe-garki", "07:20", 1050, "d1", False), ("r-gwagwalada-cbd", "06:40", 1950, "d2", False),
    ("r-cbd-nyanya", "17:30", 1350, "d3", False), ("r-cbd-nyanya", "18:00", 1350, "d1", False),
]
DEMO_RIDER_BALANCE = 8400
DEMO_USERS = [("Wailee Kareem", "8011111111", "rider"), ("Cityline Coaches", "8033333333", "operator")]


def seed(db: Session) -> None:
    if not db.get(Area, "nyanya"):
        db.add_all(Area(id=i, name=n) for i, n in AREAS)
        db.flush()
        for sid, area, name, lm, x, y, pk, dp, al in STOPS:
            lat, lng = _geo(x, y)
            db.add(Stop(id=sid, area_id=area, name=name, landmark=lm, lat=lat, lng=lng, pickup_allowed=pk, dropoff_allowed=dp, aliases=al))
        db.flush()
        for rid, name, stops in ROUTES:
            db.add(Route(id=rid, name=name))
            db.flush()
            for pos, (sid, mins, km) in enumerate(stops):
                db.add(RouteStop(route_id=rid, position=pos, stop_id=sid, minutes=mins, km=km))
        db.commit()
    if settings.demo:
        seed_demo(db)


def seed_demo(db: Session) -> None:
    drivers: dict[str, tuple[User, Vehicle]] = {}
    for key, name, phone, plate, make, color in DEMO_DRIVERS:
        u = db.scalar(select(User).where(User.phone == phone))
        if not u:
            u = User(name=name, phone=phone, role="driver", id_verified=True)
            db.add(u)
            db.flush()
        v = db.scalar(select(Vehicle).where(Vehicle.plate == plate))
        if not v:
            v = Vehicle(driver_id=u.id, plate=plate, make=make, color=color)
            db.add(v)
            db.flush()
        drivers[key] = (u, v)
    for name, phone, role in DEMO_USERS:
        u = db.scalar(select(User).where(User.phone == phone))
        if not u:
            u = User(name=name, phone=phone, role=role, id_verified=True)
            db.add(u)
            db.flush()
        # The demo rider starts with some wallet money (a one-off ledger credit), like the frontend's old local demo.
        if role == "rider" and not db.scalar(select(LedgerEntry.id).where(LedgerEntry.user_id == u.id).limit(1)):
            db.add(LedgerEntry(user_id=u.id, amount=DEMO_RIDER_BALANCE, kind="top_up", note="Demo starting balance", external_ref=f"demo-start:{u.id}"))
    # Trips for today + the next 3 days (Lagos time), only for days that have none yet.
    today = lagos_today().replace(hour=0, minute=0, second=0, microsecond=0)
    for offset in range(4):
        day = today + timedelta(days=offset)
        start = (day - timedelta(hours=1)).replace(tzinfo=None)  # Lagos midnight in UTC (naive)
        if db.scalar(select(Trip.id).where(Trip.departs_at >= start, Trip.departs_at < start + timedelta(days=1)).limit(1)):
            continue
        for rid, hhmm, price, dkey, women in DEMO_TRIPS:
            h, m = map(int, hhmm.split(":"))
            local = day.replace(hour=h, minute=m)
            u, v = drivers[dkey]
            db.add(Trip(route_id=rid, driver_id=u.id, vehicle_id=v.id, departs_at=local.astimezone(LAGOS).replace(tzinfo=None) - timedelta(hours=1), price=price, women_only=women))
    db.commit()


# Demo only: rides leaving soon, so "Today" is never empty. (route, minutes from now, price, driver key, women_only)
SOON = [("r-nyanya-cbd", 40, 1350, "d1", False), ("r-nyanya-cbd", 65, 1350, "d3", False), ("r-nyanya-jabi", 50, 1450, "d4", False),
        ("r-kubwa-wuse", 55, 1650, "d3", False), ("r-gwarinpa-wuse", 45, 1050, "d2", False), ("r-lugbe-garki", 60, 1050, "d1", False),
        ("r-cbd-nyanya", 70, 1350, "d1", False), ("r-cbd-nyanya", 95, 1350, "d2", True)]


def ensure_soon_trips(db: Session) -> None:
    """Adds a few demo trips departing in the next hour or two, unless enough are already scheduled."""
    now = utcnow()
    if (db.scalar(select(func.count()).select_from(Trip).where(Trip.status == "scheduled", Trip.departs_at > now + timedelta(minutes=20), Trip.departs_at < now + timedelta(hours=2))) or 0) >= 6:
        return
    keys = {d[0]: d for d in DEMO_DRIVERS}
    for rid, mins, price, dkey, women in SOON:
        _, name, phone, plate, _, _ = keys[dkey]
        u = db.scalar(select(User).where(User.phone == phone))
        v = db.scalar(select(Vehicle).where(Vehicle.plate == plate))
        if u and v:
            db.add(Trip(route_id=rid, driver_id=u.id, vehicle_id=v.id, departs_at=now + timedelta(minutes=mins), price=price, women_only=women))
    db.commit()
