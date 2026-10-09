from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """Typed error. Clients switch on `code`, never on `message`.
    Codes: NO_TRIP | NO_SELECTION | SEAT_TAKEN | INSUFFICIENT_FUNDS | ID_REQUIRED (booking, same as the frontend's
    BookingErrorCode) plus AUTH_REQUIRED, FORBIDDEN, NOT_FOUND, INVALID_OTP, INVALID_INPUT, UNAVAILABLE."""

    def __init__(self, code: str, message: str, status: int = 400, **extra):
        self.code, self.message, self.status, self.extra = code, message, status, extra


async def api_error_handler(_: Request, exc: ApiError):
    return JSONResponse(status_code=exc.status, content={"error": {"code": exc.code, "message": exc.message, **exc.extra}})
