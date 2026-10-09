import itertools

from .conftest import DRIVER_PHONES, first_ride, fund, login, sign, verify

_n = itertools.count(1)


def rider(client, funded=20000, verified=True):
    phone = f"80{next(_n):08d}"
    h = login(client, phone, "Test Rider", "rider")
    if verified:
        verify(client, h)
    if funded:
        fund(client, h, funded)
    return h


def book(client, h, ride, seat=None, payment="wallet"):
    t = ride["trip"]
    if seat is None:  # first free non-front seat right now
        taken = client.get(f"/trips/{t['id']}").json()["taken"]
        seat = next(s for s in ("back-m", "back-l", "back-r") if s not in taken)
    return client.post("/bookings", json={"trip_id": t["id"], "seat": seat, "pickup_stop": ride["pickup"]["id"], "dropoff_stop": ride["dropoff"]["id"], "payment": payment}, headers=h)


# ------------------------------- auth -------------------------------
def test_new_account_needs_name_and_role(client):
    r = client.post("/auth/otp/verify", json={"phone": "8099990001", "code": "123456"})
    assert r.status_code == 422 and r.json()["error"]["new_account"] is True


def test_bad_phone_rejected(client):
    assert client.post("/auth/otp/request", json={"phone": "12345"}).status_code == 422


def test_requires_token(client):
    r = client.get("/wallet")
    assert r.status_code == 401 and r.json()["error"]["code"] == "AUTH_REQUIRED"


# ------------------------------- search -------------------------------
def test_search_exact_and_order(client):
    res = client.get("/rides", params={"from": "nyanya", "to": "cbd", "day": 1}).json()
    assert res["count"] == 3
    assert all(r["pickup"]["id"] == "nyanya" and r["dropoff"]["id"] == "cbd" for r in res["results"])


def test_search_mid_route_pickup_and_wrong_direction(client):
    mid = client.get("/rides", params={"from": "berger", "to": "jabi-mall", "day": 1}).json()
    assert mid["count"] == 2  # Nyanya→Jabi trips, boarding at Berger
    assert client.get("/rides", params={"from": "cbd", "to": "berger", "day": 1}).json()["count"] >= 1
    assert client.get("/rides", params={"from": "jabi-mall", "to": "berger", "day": 1}).json()["count"] == 0  # order matters


def test_search_near_match_reports_offset(client):
    # Jabi Under Bridge is drop-off only; asking to be PICKED UP there offers Jabi Lake Mall (same area, within range).
    res = client.get("/rides", params={"from": "jabi-bridge", "to": "wuse2", "day": 1}).json()["results"]
    assert res and res[0]["pickup"]["id"] == "jabi-mall" and 0 < res[0]["pickup"]["offset_m"] <= 600


def test_stop_search_by_area_and_alias(client):
    assert {s["id"] for s in client.get("/stops", params={"q": "jabi"}).json()} >= {"jabi-mall", "jabi-park", "jabi-bridge"}
    assert client.get("/stops", params={"q": "julius berger"}).json()[0]["id"] == "berger"


# ------------------------------- booking rules -------------------------------
def test_id_required_for_first_booking(client):
    h = rider(client, verified=False)
    ride = first_ride(client, day=2)
    r = book(client, h, ride)
    assert r.status_code == 403 and r.json()["error"]["code"] == "ID_REQUIRED"
    verify(client, h)
    assert book(client, h, ride).status_code == 201


def test_insufficient_funds_reports_shortfall(client):
    h = rider(client, funded=500)
    r = book(client, h, first_ride(client, day=2))
    err = r.json()["error"]
    assert r.status_code == 402 and err["code"] == "INSUFFICIENT_FUNDS" and err["shortBy"] > 0


def test_booking_charges_wallet_once_all_in(client):
    h = rider(client, funded=5000)
    ride = first_ride(client, day=3)
    b = book(client, h, ride).json()
    assert b["price_paid"] == ride["trip"]["price"] and len(b["boarding_code"]) == 4
    w = client.get("/wallet", headers=h).json()
    assert w["balance"] == 5000 - ride["trip"]["price"]


def test_front_seat_costs_premium(client):
    h = rider(client)
    ride = first_ride(client, day=3, idx=1)
    b = book(client, h, ride, seat="front").json()
    assert b["price_paid"] == ride["trip"]["price"] + 300


def test_seat_taken_second_rider_loses(client):
    ride = first_ride(client, day=1, idx=2)
    a, b = rider(client), rider(client)
    assert book(client, a, ride, "back-r").status_code == 201
    r = book(client, b, ride, "back-r")
    assert r.status_code == 409 and r.json()["error"]["code"] == "SEAT_TAKEN"
    # the loser was not charged
    assert client.get("/wallet", headers=b).json()["balance"] == 20000
    # and the seat shows as taken in search
    again = client.get("/trips/" + ride["trip"]["id"]).json()
    assert "back-r" in again["taken"]


def test_invalid_stop_order_rejected(client):
    h = rider(client)
    ride = first_ride(client)
    bad = client.post("/bookings", json={"trip_id": ride["trip"]["id"], "seat": "back-m", "pickup_stop": "cbd", "dropoff_stop": "nyanya"}, headers=h)
    assert bad.status_code == 422 and bad.json()["error"]["code"] == "NO_SELECTION"


def test_cannot_pay_by_card_yet(client):
    h = rider(client)
    assert book(client, h, first_ride(client, day=2), payment="card").json()["error"]["code"] == "UNAVAILABLE"


def test_only_rider_sees_boarding_code(client):
    h = rider(client)
    b = book(client, h, first_ride(client, day=2, idx=1)).json()
    other = rider(client)
    assert client.get(f"/bookings/{b['id']}", headers=other).status_code == 404
    assert "boarding_code" in client.get(f"/bookings/{b['id']}", headers=h).json()


# ------------------------------- cancellation + refunds -------------------------------
def test_rider_cancel_before_window_refunds(client):
    h = rider(client)
    ride = first_ride(client, day=2, idx=2)
    b = book(client, h, ride, "back-m").json()
    r = client.post(f"/bookings/{b['id']}/cancel", headers=h).json()
    assert r["status"] == "cancelled" and r["cancelled_by"] == "rider" and r["refunded"] == b["price_paid"]
    assert client.get("/wallet", headers=h).json()["balance"] == 20000
    # seat is free again
    assert book(client, rider(client), ride, "back-m").status_code == 201


def test_driver_cancel_refunds_everyone(client):
    ride = first_ride(client, "lugbe", "garki", day=2)  # Ade's trip, used by no other test
    d = login(client, DRIVER_PHONES[ride["trip"]["driver"]["name"]])
    a, b = rider(client), rider(client)
    assert book(client, a, ride, "back-l").status_code == 201 and book(client, b, ride, "back-r").status_code == 201
    out = client.post(f"/driver/trips/{ride['trip']['id']}/cancel", headers=d).json()
    assert out["riders_refunded"] == 2 * ride["trip"]["price"]
    for h in (a, b):
        assert client.get("/wallet", headers=h).json()["balance"] == 20000
        assert client.get("/bookings", headers=h).json()[0]["cancelled_by"] == "driver"
    # a cancelled trip no longer appears in search
    assert client.get("/rides", params={"from": "lugbe", "to": "garki", "day": 2}).json()["count"] == 0


# ------------------------------- full trip + earnings -------------------------------
def test_full_trip_lifecycle_and_driver_earns_net_of_commission(client):
    ride = first_ride(client, "nyanya", "jabi-mall", day=2)
    target = ride["trip"]
    d = login(client, DRIVER_PHONES[target["driver"]["name"]])
    a, b = rider(client), rider(client)
    ba = book(client, a, ride, "back-l").json()
    bb = book(client, b, ride, "back-r").json()
    before = client.get("/driver/earnings", headers=d).json()["balance"]

    assert client.post(f"/driver/trips/{target['id']}/progress", json={"progress": "arriving"}, headers=d).json()["updated"] == 2
    assert client.get(f"/bookings/{ba['id']}", headers=a).json()["progress"] == "arriving"
    wrong = client.post(f"/driver/trips/{target['id']}/board", json={"code": "0000" if ba["boarding_code"] != "0000" and bb["boarding_code"] != "0000" else "9999"}, headers=d)
    assert wrong.status_code == 404
    assert client.post(f"/driver/trips/{target['id']}/board", json={"code": ba["boarding_code"]}, headers=d).status_code == 200
    assert client.post(f"/driver/trips/{target['id']}/start", headers=d).status_code == 200
    done = client.post(f"/driver/trips/{target['id']}/complete", headers=d).json()
    # a boarded; b never boarded -> no-show, but still paid
    assert done["earned"] == 2 * round(target["price"] * 0.9)
    assert client.get("/driver/earnings", headers=d).json()["balance"] == before + done["earned"]
    assert client.get(f"/bookings/{ba['id']}", headers=a).json()["status"] == "completed"
    nb = client.get(f"/bookings/{bb['id']}", headers=b).json()
    assert nb["status"] == "cancelled" and nb["cancelled_by"] == "no_show"
    # rate with a tip
    r = client.post(f"/bookings/{ba['id']}/rate", json={"stars": 5, "tags": ["Punctual"], "tip": 200}, headers=a)
    assert r.status_code == 200 and r.json()["tip"] == 200
    assert client.post(f"/bookings/{ba['id']}/rate", json={"stars": 4}, headers=a).status_code == 409  # once only


# ------------------------------- wallet -------------------------------
def test_top_up_pending_until_signed_webhook_and_idempotent(client):
    h = rider(client, funded=0)
    t = client.post("/wallet/top-ups", json={"amount": 3000}, headers=h).json()
    w = client.get("/wallet", headers=h).json()
    assert w["balance"] == 0 and w["pending_top_ups"][0]["amount"] == 3000
    raw, sig = sign({"reference": t["id"], "status": "success", "amount": 3000, "external_ref": "bank-x1"})
    assert client.post("/webhooks/payments", content=raw, headers={"X-Signature": "bad"}).status_code == 401
    assert client.post("/webhooks/payments", content=raw, headers={"X-Signature": sig}).json()["credited"] is True
    assert client.post("/webhooks/payments", content=raw, headers={"X-Signature": sig}).json()["credited"] is False
    assert client.get("/wallet", headers=h).json()["balance"] == 3000


def test_webhook_amount_mismatch_rejected(client):
    h = rider(client, funded=0)
    t = client.post("/wallet/top-ups", json={"amount": 1000}, headers=h).json()
    raw, sig = sign({"reference": t["id"], "status": "success", "amount": 9999, "external_ref": "bank-x2"})
    assert client.post("/webhooks/payments", content=raw, headers={"X-Signature": sig}).status_code == 422
    assert client.get("/wallet", headers=h).json()["balance"] == 0


def test_driver_withdrawal_rules(client):
    d = login(client, DRIVER_PHONES["Ngozi Obi"])
    bal = client.get("/driver/earnings", headers=d).json()["balance"]
    assert bal >= 2000
    body = {"amount": 1000, "bank": "GTBank", "account_number": "0123456789"}
    first = client.post("/driver/withdraw", json=body, headers=d).json()
    second = client.post("/driver/withdraw", json=body, headers=d).json()
    assert first["fee"] == 0 and second["fee"] == 50  # 1 free per day, then ₦50
    assert client.post("/driver/withdraw", json={**body, "amount": 500}, headers=d).status_code == 422


# ------------------------------- safety, usual routes, messages -------------------------------
def test_contacts_reports_sos(client):
    h = rider(client, funded=0)
    c = client.post("/safety/contacts", json={"name": "Mum", "phone": "8055550101"}, headers=h).json()
    assert client.post("/safety/contacts", json={"name": "X", "phone": "123"}, headers=h).status_code == 422
    assert len(client.get("/safety/contacts", headers=h).json()) == 1
    assert client.delete(f"/safety/contacts/{c['id']}", headers=h).status_code == 204
    rep = client.post("/reports", json={"category": "Unsafe driving", "details": "x"}, headers=h).json()
    assert rep["ref"].startswith("MW-") and client.get("/reports", headers=h).json()[0]["ref"] == rep["ref"]
    s = client.post("/sos", json={"lat": 9.07, "lng": 7.42}, headers=h).json()
    assert s["recorded"] is True and s["acknowledged"] is False


def test_usual_route_upsert_and_delete(client):
    h = rider(client, funded=0)
    body = {"from_stop": "nyanya", "to_stop": "cbd", "days": [0, 1, 2], "time_of_day": "07:10"}
    u = client.put("/usual-routes", json=body, headers=h).json()
    u2 = client.put("/usual-routes", json={**body, "days": [0, 4]}, headers=h).json()
    assert u["id"] == u2["id"] and u2["days"] == [0, 4]
    assert client.put("/usual-routes", json={**body, "to_stop": "nyanya"}, headers=h).status_code == 422
    assert client.delete(f"/usual-routes/{u['id']}", headers=h).status_code == 204


def test_messages_between_rider_and_driver(client):
    h = rider(client)
    ride = first_ride(client, day=1, idx=1)
    b = book(client, h, ride).json()
    assert client.post(f"/bookings/{b['id']}/messages", json={"text": "I'm at the pickup"}, headers=h).status_code == 201
    d = login(client, DRIVER_PHONES[ride["trip"]["driver"]["name"]])
    assert client.post(f"/bookings/{b['id']}/messages", json={"text": "Coming"}, headers=d).status_code == 201
    msgs = client.get(f"/bookings/{b['id']}/messages", headers=h).json()
    assert [m["from"] for m in msgs] == ["rider", "driver"]
    stranger = rider(client, funded=0)
    assert client.get(f"/bookings/{b['id']}/messages", headers=stranger).status_code == 404


# ------------------------------- concurrency -------------------------------
def test_simultaneous_requests_for_one_seat_have_exactly_one_winner(client):
    from concurrent.futures import ThreadPoolExecutor

    ride = first_ride(client, "kubwa", "wuse2", day=1)
    riders = [rider(client) for _ in range(6)]
    with ThreadPoolExecutor(max_workers=6) as pool:
        codes = list(pool.map(lambda h: book(client, h, ride, "back-m").status_code, riders))
    assert sorted(codes).count(201) == 1 and codes.count(409) == 5
    # losers were never charged
    charged = [client.get("/wallet", headers=h).json()["balance"] for h in riders]
    assert sorted(charged).count(20000) == 5


def test_demo_rider_starts_funded_and_today_has_rides(client):
    h = login(client, "8011111111")
    assert client.get("/wallet", headers=h).json()["balance"] >= 0
    assert client.get("/rides", params={"from": "nyanya", "to": "cbd", "day": 0}).json()["count"] >= 1


def test_trip_includes_driver_stats(client):
    r = first_ride(client, day=2)
    d = r["trip"]["driver"]
    assert "rating" in d and "trips" in d


def test_demo_controls_move_trip_and_pay_driver(client):
    h = login(client, "8099990001", "Dev Rider", "rider")
    verify(client, h)
    fund(client, h, 5000)
    ride = first_ride(client, day=3, idx=1)
    b = client.post("/bookings", json={"trip_id": ride["trip"]["id"], "seat": "back-m", "pickup_stop": ride["pickup"]["id"], "dropoff_stop": ride["dropoff"]["id"]}, headers=h)
    assert b.status_code == 201, b.text
    bid = b.json()["id"]
    assert client.post(f"/dev/bookings/{bid}/late", json={"minutes": 10}, headers=h).json()["late_minutes"] == 10
    assert client.post(f"/dev/bookings/{bid}/progress", json={"progress": "dropped_off"}, headers=h).json()["status"] == "completed"
    assert client.post(f"/dev/bookings/{bid}/progress", json={"progress": "arriving"}, headers=h).status_code == 409
    assert client.post(f"/bookings/{bid}/rate", json={"stars": 5, "tags": [], "tip": 0}, headers=h).json()["rating"] == 5
