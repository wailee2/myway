from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base, utcnow


def _id() -> str:
    import uuid
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    phone: Mapped[str] = mapped_column(String(15), unique=True)  # national format 8031234567
    name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(10))  # rider | driver | operator
    # Riders: set at FIRST BOOKING. Drivers/operators: at sign-up. The NIN itself is never stored.
    id_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    phone: Mapped[str] = mapped_column(String(15), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    used: Mapped[bool] = mapped_column(Boolean, default=False)


class Area(Base):
    __tablename__ = "areas"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))


class Stop(Base):
    __tablename__ = "stops"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    area_id: Mapped[str] = mapped_column(ForeignKey("areas.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    landmark: Mapped[str] = mapped_column(String(160))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    pickup_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    dropoff_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    aliases: Mapped[list] = mapped_column(JSON, default=list)


class Route(Base):
    __tablename__ = "routes"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    stops: Mapped[list["RouteStop"]] = relationship(order_by="RouteStop.position", lazy="selectin")


class RouteStop(Base):
    __tablename__ = "route_stops"
    route_id: Mapped[str] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, primary_key=True)
    stop_id: Mapped[str] = mapped_column(ForeignKey("stops.id"))
    minutes: Mapped[int] = mapped_column(Integer)  # from route start
    km: Mapped[float] = mapped_column(Float)  # from route start (enables segment pricing later)
    __table_args__ = (UniqueConstraint("route_id", "stop_id"),)


class Vehicle(Base):
    __tablename__ = "vehicles"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    driver_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    plate: Mapped[str] = mapped_column(String(20), unique=True)
    make: Mapped[str] = mapped_column(String(60))
    color: Mapped[str] = mapped_column(String(30))


class Trip(Base):
    __tablename__ = "trips"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    route_id: Mapped[str] = mapped_column(ForeignKey("routes.id"))
    driver_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"))
    departs_at: Mapped[datetime] = mapped_column(DateTime)  # UTC, at the route's first stop
    price: Mapped[int] = mapped_column(Integer)  # ALL-IN back-seat fare; front seat adds a premium
    women_only: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(24), default="scheduled")  # scheduled|started|completed|cancelled_by_driver
    repeat_rule: Mapped[str | None] = mapped_column(String(40), nullable=True)  # None unless the driver turned repeat ON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    route: Mapped[Route] = relationship(lazy="joined")
    driver: Mapped[User] = relationship(lazy="joined")
    vehicle: Mapped[Vehicle] = relationship(lazy="joined")
    __table_args__ = (Index("trips_search_idx", "route_id", "departs_at"),)


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"), index=True)
    rider_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    seat: Mapped[str] = mapped_column(String(8))
    pickup_stop: Mapped[str] = mapped_column(ForeignKey("stops.id"))
    dropoff_stop: Mapped[str] = mapped_column(ForeignKey("stops.id"))
    price_paid: Mapped[int] = mapped_column(Integer)  # the fare for the seat
    charged: Mapped[int] = mapped_column(Integer)  # what left the wallet at booking (fare, or the cash hold)
    payment: Mapped[str] = mapped_column(String(10))
    boarding_code: Mapped[str] = mapped_column(String(4))
    status: Mapped[str] = mapped_column(String(12), default="upcoming")  # upcoming|completed|cancelled
    progress: Mapped[str] = mapped_column(String(12), default="assigned")  # assigned|on_the_way|arriving|boarded|dropped_off
    cancelled_by: Mapped[str | None] = mapped_column(String(10), nullable=True)  # rider|driver|no_show
    late_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rating_tags: Mapped[list] = mapped_column(JSON, default=list)
    tip: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    trip: Mapped[Trip] = relationship(lazy="joined")
    rider: Mapped[User] = relationship(lazy="joined")
    __table_args__ = (
        # THE seat-race guard: a seat has at most one live booking. A second concurrent insert fails here,
        # so two riders can never hold the same seat. Cancelling frees the seat.
        Index("bookings_live_seat", "trip_id", "seat", unique=True,
              sqlite_where=(status != "cancelled"), postgresql_where=(status != "cancelled")),
    )


class LedgerEntry(Base):
    """Append-only. A wallet balance is the sum of `amount` for the user. Never update or delete rows."""
    __tablename__ = "wallet_ledger"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column(Integer)  # + credit, - debit
    kind: Mapped[str] = mapped_column(String(12))  # top_up|ride|hold|refund|tip|earning|payout|fee
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id"), nullable=True)
    note: Mapped[str] = mapped_column(String(120), default="")
    external_ref: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class TopUp(Base):
    __tablename__ = "top_ups"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending|confirmed|failed|cancelled
    external_ref: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SavedRoute(Base):
    __tablename__ = "saved_routes"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    from_stop: Mapped[str] = mapped_column(ForeignKey("stops.id"))
    to_stop: Mapped[str] = mapped_column(ForeignKey("stops.id"))
    days: Mapped[list] = mapped_column(JSON)  # 0 = Monday … 6 = Sunday
    time_of_day: Mapped[str] = mapped_column(String(5))  # "07:10"
    __table_args__ = (UniqueConstraint("user_id", "from_stop", "to_stop"),)


class RouteRequest(Base):
    __tablename__ = "route_requests"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    from_text: Mapped[str] = mapped_column(String(120))
    to_text: Mapped[str] = mapped_column(String(120))
    days: Mapped[list] = mapped_column(JSON, default=list)
    time_text: Mapped[str] = mapped_column(String(20), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(60))
    phone: Mapped[str] = mapped_column(String(15))


class Report(Base):
    __tablename__ = "reports"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    ref: Mapped[str] = mapped_column(String(10), unique=True)  # "MW-4821", quoted by the rider to support
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(60))
    details: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(12), default="received")  # received|in_review|resolved
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SosEvent(Base):
    __tablename__ = "sos_events"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id"), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    acknowledged_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    sender: Mapped[str] = mapped_column(String(6))  # rider | driver
    text: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
