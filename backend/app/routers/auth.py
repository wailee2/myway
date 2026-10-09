import logging
import re
from datetime import timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db, utcnow
from ..errors import ApiError
from ..models import OtpCode, User
from ..security import current_user, hash_otp, make_token, new_otp

router = APIRouter(tags=["auth"])
log = logging.getLogger("myway.auth")
PHONE = re.compile(r"^[789]\d{9}$")  # Nigerian mobile, national format


class OtpRequest(BaseModel):
    phone: str


class OtpVerify(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6)
    # Needed only the first time (sign-up):
    name: str | None = Field(default=None, max_length=80)
    role: str | None = None


def _phone(p: str) -> str:
    p = re.sub(r"\D", "", p)
    if p.startswith("234") and len(p) == 13:
        p = p[3:]
    p = p.lstrip("0") if len(p) == 11 else p
    if not PHONE.match(p):
        raise ApiError("INVALID_INPUT", "Enter a valid Nigerian mobile number, e.g. 8031234567.", 422)
    return p


def user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "phone": u.phone, "role": u.role, "id_verified": u.id_verified}


@router.post("/auth/otp/request")
def request_otp(body: OtpRequest, db: Session = Depends(get_db)):
    phone = _phone(body.phone)
    recent = db.scalars(select(OtpCode).where(OtpCode.phone == phone, OtpCode.expires_at > utcnow() + timedelta(minutes=4)))
    if recent.first():  # 1 code per minute per number
        raise ApiError("UNAVAILABLE", "A code was just sent. Wait a minute before asking for another.", 429)
    code = new_otp()
    db.add(OtpCode(phone=phone, code_hash=hash_otp(phone, code), expires_at=utcnow() + timedelta(minutes=5)))
    db.commit()
    # TODO(sms): hand `code` to the SMS provider here. Until one is attached the code is only logged.
    log.warning("OTP for %s: %s (no SMS provider attached)", phone, code if settings.demo else "******")
    return {"sent": True, "expires_in": 300, **({"demo_hint": f"Demo: {settings.demo_otp} always works."} if settings.demo else {})}


@router.post("/auth/otp/verify")
def verify_otp(body: OtpVerify, db: Session = Depends(get_db)):
    phone = _phone(body.phone)
    ok = settings.demo and body.code == settings.demo_otp
    if not ok:
        otp = db.scalars(select(OtpCode).where(OtpCode.phone == phone, OtpCode.used == False, OtpCode.expires_at > utcnow()).order_by(OtpCode.expires_at.desc())).first()  # noqa: E712
        if not otp or otp.attempts >= 5:
            raise ApiError("INVALID_OTP", "That code has expired. Request a new one.", 401)
        otp.attempts += 1
        if otp.code_hash != hash_otp(phone, body.code):
            db.commit()
            raise ApiError("INVALID_OTP", "That code isn't right. Check the 6 digits and try again.", 401)
        otp.used = True
    user = db.scalar(select(User).where(User.phone == phone))
    if not user:
        if not body.name or len(body.name.strip()) < 2 or body.role not in ("rider", "driver", "operator"):
            raise ApiError("INVALID_INPUT", "New account: send your name and role (rider, driver or operator).", 422, new_account=True)
        # Drivers and operators verify up front (separate step); riders at their first booking.
        user = User(phone=phone, name=body.name.strip(), role=body.role, id_verified=False)
        db.add(user)
    db.commit()
    return {"token": make_token(user), "user": user_out(user)}


@router.get("/me")
def me(user: User = Depends(current_user)):
    return user_out(user)


class VerifyId(BaseModel):
    nin: str
    selfie_captured: bool


@router.post("/me/verify-id")
def verify_id(body: VerifyId, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Marks the user ID-verified. The NIN is validated for shape and DISCARDED: we never store it.
    TODO(kyc): call the identity provider (NIN lookup + face match) before setting id_verified."""
    if not re.fullmatch(r"\d{11}", body.nin):
        raise ApiError("INVALID_INPUT", "A NIN has 11 digits.", 422)
    if not body.selfie_captured:
        raise ApiError("INVALID_INPUT", "Take a quick selfie so we can match it to your ID.", 422)
    user.id_verified = True
    db.commit()
    return user_out(user)
