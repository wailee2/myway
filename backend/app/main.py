import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import Base, SessionLocal, engine
from .errors import ApiError, api_error_handler
from .routers import auth, bookings, catalog, dev, driver, safety, wallet
from .seed import seed

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience. For production use Alembic migrations (docs/BACKEND.md) instead of create_all.
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="MYWAY API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.cors_origins.split(",")], allow_methods=["*"], allow_headers=["*"])
app.add_exception_handler(ApiError, api_error_handler)


@app.exception_handler(RequestValidationError)
async def validation_handler(_, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    return JSONResponse(status_code=422, content={"error": {"code": "INVALID_INPUT", "message": f"Check this field: {'.'.join(str(p) for p in first.get('loc', [])[1:])}", "fields": [{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()]}})


@app.get("/health")
def health():
    return {"ok": True, "demo": settings.demo}


for r in (auth.router, catalog.router, bookings.router, wallet.router, driver.router, safety.router):
    app.include_router(r)
if settings.demo:
    app.include_router(dev.router)
