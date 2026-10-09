import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..errors import ApiError
from ..models import LedgerEntry, TopUp, User
from .. import services as svc
from ..security import current_user

router = APIRouter(tags=["wallet"])


@router.get("/wallet")
def wallet(user: User = Depends(current_user), db: Session = Depends(get_db)):
    ledger = db.scalars(select(LedgerEntry).where(LedgerEntry.user_id == user.id).order_by(LedgerEntry.created_at.desc()).limit(50))
    pending = db.scalars(select(TopUp).where(TopUp.user_id == user.id, TopUp.status == "pending").order_by(TopUp.created_at.desc()))
    return {
        "balance": svc.balance(db, user.id),
        "transactions": [{"id": e.id, "amount": e.amount, "kind": e.kind, "note": e.note, "at": svc.iso(e.created_at)} for e in ledger],
        "pending_top_ups": [{"id": t.id, "amount": t.amount, "created_at": svc.iso(t.created_at)} for t in pending],
    }


class NewTopUp(BaseModel):
    amount: int = Field(ge=100, le=500_000)


@router.post("/wallet/top-ups", status_code=201)
def create_top_up(body: NewTopUp, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Creates a PENDING top-up. The balance changes only when the payment provider's webhook confirms it."""
    t = TopUp(user_id=user.id, amount=body.amount)
    db.add(t)
    db.commit()
    # TODO(payments): ask the provider for a dedicated virtual account / checkout link for t.id and return it here.
    return {"id": t.id, "amount": t.amount, "status": t.status, "reference": t.id,
            "payment_instructions": None if not settings.demo else {"note": "Demo: no real account. Use the dev confirm endpoint."}}


@router.delete("/wallet/top-ups/{top_up_id}", status_code=204)
def cancel_top_up(top_up_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    t = db.get(TopUp, top_up_id)
    if not t or t.user_id != user.id or t.status != "pending":
        raise ApiError("NOT_FOUND", "We can't find that pending top-up.", 404)
    t.status = "cancelled"
    db.commit()


def _confirm(db: Session, t: TopUp, external_ref: str | None) -> bool:
    """Idempotent: confirming twice credits once (also enforced by the unique ledger external_ref)."""
    if t.status == "confirmed":
        return False
    t.status, t.external_ref = "confirmed", external_ref
    svc.credit(db, t.user_id, t.amount, "top_up", note="Top up · Bank transfer", external_ref=external_ref or f"topup:{t.id}")
    return True


class PaymentEvent(BaseModel):
    reference: str  # our top-up id
    status: str  # "success" | "failed"
    amount: int
    external_ref: str


@router.post("/webhooks/payments")
async def payments_webhook(request: Request, x_signature: str = Header(default=""), db: Session = Depends(get_db)):
    raw = await request.body()
    expected = hmac.new(settings.webhook_secret.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_signature):
        raise ApiError("FORBIDDEN", "Bad signature.", 401)
    ev = PaymentEvent(**json.loads(raw))
    t = db.get(TopUp, ev.reference)
    if not t:
        raise ApiError("NOT_FOUND", "Unknown reference.", 404)
    if ev.status != "success":
        if t.status == "pending":
            t.status = "failed"
            db.commit()
        return {"ok": True, "credited": False}
    if ev.amount != t.amount:
        raise ApiError("INVALID_INPUT", "Amount doesn't match the top-up.", 422)
    credited = _confirm(db, t, ev.external_ref)
    db.commit()
    return {"ok": True, "credited": credited}


@router.post("/dev/top-ups/{top_up_id}/confirm")
def dev_confirm(top_up_id: str, db: Session = Depends(get_db)):
    """DEMO ONLY: stands in for the bank webhook. Not mounted when demo is off."""
    t = db.get(TopUp, top_up_id)
    if not settings.demo or not t:
        raise ApiError("NOT_FOUND", "Not found.", 404)
    credited = _confirm(db, t, None)
    db.commit()
    return {"ok": True, "credited": credited, "balance": svc.balance(db, t.user_id)}
