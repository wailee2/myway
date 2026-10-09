import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .errors import ApiError
from .models import User


def hash_otp(phone: str, code: str) -> str:
    return hmac.new(settings.jwt_secret.encode(), f"{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def new_otp() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def make_token(user: User) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_hours)
    return jwt.encode({"sub": user.id, "role": user.role, "exp": exp}, settings.jwt_secret, algorithm="HS256")


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError("AUTH_REQUIRED", "Sign in to continue.", 401)
    try:
        claims = jwt.decode(authorization[7:], settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise ApiError("AUTH_REQUIRED", "Your session expired. Sign in again.", 401)
    user = db.get(User, claims["sub"])
    if not user:
        raise ApiError("AUTH_REQUIRED", "Sign in to continue.", 401)
    return user


def require_role(*roles: str):
    def dep(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise ApiError("FORBIDDEN", "That action isn't available for your account type.", 403)
        return user
    return dep
