import hashlib
import hmac
import json
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["DEMO"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def login(client, phone, name=None, role=None):
    body = {"phone": phone, "code": settings.demo_otp, "name": name, "role": role}
    r = client.post("/auth/otp/verify", json=body)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def sign(payload: dict) -> tuple[bytes, str]:
    raw = json.dumps(payload).encode()
    return raw, hmac.new(settings.webhook_secret.encode(), raw, hashlib.sha256).hexdigest()


def fund(client, h, amount):
    t = client.post("/wallet/top-ups", json={"amount": amount}, headers=h).json()
    raw, sig = sign({"reference": t["id"], "status": "success", "amount": amount, "external_ref": f"bank-{t['id']}"})
    r = client.post("/webhooks/payments", content=raw, headers={"X-Signature": sig})
    assert r.status_code == 200, r.text
    return t


def verify(client, h):
    assert client.post("/me/verify-id", json={"nin": "12345678901", "selfie_captured": True}, headers=h).status_code == 200


def first_ride(client, frm="nyanya", to="cbd", day=1, idx=0):
    """A seeded ride. Tests use different (day, idx) pairs so they never fight over the same seat.
    Day 0 is avoided for booking because its morning trips may already have departed."""
    res = client.get("/rides", params={"from": frm, "to": to, "day": day}).json()["results"]
    assert len(res) > idx, "seed should have rides"
    return res[idx]


DRIVER_PHONES = {"Ade Okafor": "8022222222", "Chioma Eze": "8044444441", "Musa Ibrahim": "8044444442", "Ngozi Obi": "8044444443"}
