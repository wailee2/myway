-- MYWAY backend schema (Phase 1 design, built in Phase 6). PostgreSQL 15+.
-- Money is stored as integer kobo-free naira (whole ₦). Timestamps are UTC.

create extension if not exists "pgcrypto";

create table users (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,                 -- national format, e.g. 8031234567
  name          text not null,
  role          text not null check (role in ('rider','driver','operator')),
  id_verified   boolean not null default false,       -- riders: set at FIRST BOOKING; drivers/operators: at sign-up
  created_at    timestamptz not null default now()
);

create table areas (
  id    text primary key,                             -- 'jabi'
  name  text not null
);

create table stops (
  id              text primary key,                   -- 'jabi-mall'
  area_id         text not null references areas(id),
  name            text not null,
  landmark        text not null,
  lat             double precision not null,
  lng             double precision not null,
  pickup_allowed  boolean not null default true,
  dropoff_allowed boolean not null default true,
  aliases         text[] not null default '{}'
);
create index stops_area_idx on stops(area_id);

create table routes (
  id    text primary key,                             -- 'r-nyanya-cbd'
  name  text not null
);

create table route_stops (
  route_id   text not null references routes(id) on delete cascade,
  position   int  not null,
  stop_id    text not null references stops(id),
  minutes    int  not null check (minutes >= 0),      -- from route start
  km         numeric(5,1) not null check (km >= 0),   -- from route start (enables segment pricing)
  primary key (route_id, position),
  unique (route_id, stop_id)
);

create table vehicles (
  id        uuid primary key default gen_random_uuid(),
  driver_id uuid not null references users(id),
  plate     text not null unique,
  make      text not null,
  color     text not null
);

create table trips (
  id          uuid primary key default gen_random_uuid(),
  route_id    text not null references routes(id),
  driver_id   uuid not null references users(id),
  vehicle_id  uuid not null references vehicles(id),
  departs_at  timestamptz not null,
  price       int  not null check (price > 0),        -- ALL-IN back-seat price; front seat adds a premium
  women_only  boolean not null default false,
  status      text not null default 'scheduled'
              check (status in ('scheduled','started','completed','cancelled_by_driver')),
  repeat_rule text,                                   -- null unless the driver explicitly turned repeat ON
  created_at  timestamptz not null default now()
);
create index trips_search_idx on trips(route_id, departs_at) where status = 'scheduled';

-- One row per seat per trip. The seat-hold race is settled by the unique constraint below:
-- the second concurrent insert for the same seat fails, so two riders can never hold one seat.
create table seat_holds (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  seat        text not null check (seat in ('front','back-l','back-m','back-r')),
  user_id     uuid not null references users(id),
  expires_at  timestamptz not null,                   -- short TTL while the rider pays
  unique (trip_id, seat)
);

create table bookings (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references trips(id),
  rider_id      uuid not null references users(id),
  seat          text not null check (seat in ('front','back-l','back-m','back-r')),
  pickup_stop   text not null references stops(id),
  dropoff_stop  text not null references stops(id),
  price_paid    int  not null,
  payment       text not null check (payment in ('wallet','card','transfer','cash')),
  boarding_code text not null,
  status        text not null default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  progress      text not null default 'assigned'
                check (progress in ('assigned','on_the_way','arriving','boarded','dropped_off')),
  cancelled_by  text check (cancelled_by in ('rider','driver','no_show')),
  late_minutes  int,
  rating        int check (rating between 1 and 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- A seat can have at most one LIVE booking; cancelling frees it.
create unique index bookings_live_seat on bookings(trip_id, seat) where status <> 'cancelled';

-- Append-only ledger. A wallet balance is sum(amount) for the user; never update rows.
create table wallet_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  amount      int  not null,                          -- + credit, - debit
  kind        text not null check (kind in ('top_up','ride','refund','tip','payout','commission','pass')),
  booking_id  uuid references bookings(id),
  external_ref text unique,                           -- bank/payment-provider reference, makes webhooks idempotent
  created_at  timestamptz not null default now()
);

-- Top-ups stay pending until the bank/provider webhook confirms; only then a ledger row is written.
create table top_ups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id),
  amount       int not null check (amount >= 100),
  status       text not null default 'pending' check (status in ('pending','confirmed','failed','cancelled')),
  external_ref text unique,
  created_at   timestamptz not null default now()
);

create table saved_routes (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references users(id) on delete cascade,
  from_stop text not null references stops(id),
  to_stop   text not null references stops(id),
  days      smallint[] not null,                      -- 0 = Monday … 6 = Sunday
  time_of_day time not null,
  unique (user_id, from_stop, to_stop)
);

-- Route demand: powers "People going your way: 14 looking" for drivers once real data exists.
create table route_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  from_stop  text references stops(id),
  to_stop    text references stops(id),
  from_text  text, to_text text,
  days       smallint[], time_of_day time,
  created_at timestamptz not null default now()
);

-- Safety and support: these MUST reach a person (see DATA_PROTECTION_AND_SUPPORT.md).
create table trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null, phone text not null
);

create table reports (
  id         uuid primary key default gen_random_uuid(),
  ref        text not null unique,                    -- 'MW-4821', quoted by the rider
  user_id    uuid not null references users(id),
  booking_id uuid references bookings(id),
  category   text not null,
  details    text,
  status     text not null default 'received' check (status in ('received','in_review','resolved')),
  created_at timestamptz not null default now()
);

create table sos_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  booking_id uuid references bookings(id),
  lat double precision, lng double precision,
  created_at timestamptz not null default now(),
  acknowledged_by uuid references users(id), acknowledged_at timestamptz
);

-- Typed error codes the API returns (mirrors BookingErrorCode in lib/types.ts):
--   NO_TRIP | NO_SELECTION | SEAT_TAKEN | INSUFFICIENT_FUNDS | ID_REQUIRED
