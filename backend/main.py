from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from livekit.api import TwirpError

from src.livekit_api import close_client
from src.middleware.auth import AuthMiddleware
from src.spa import mount_spa
from src.modules.auth.routes import router as auth_router
from src.modules.dispatch_rules.routes import router as dispatch_rules_router
from src.modules.egress.routes import router as egress_router
from src.modules.overview.routes import router as overview_router
from src.modules.rooms.routes import router as rooms_router
from src.modules.settings.routes import router as settings_router
from src.modules.trunks.routes import router as trunks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(title="LiveKit Console API", lifespan=lifespan)
app.add_middleware(AuthMiddleware)

app.include_router(auth_router)
app.include_router(overview_router)
app.include_router(rooms_router)
app.include_router(trunks_router)
app.include_router(dispatch_rules_router)
app.include_router(egress_router)
app.include_router(settings_router)

# LiveKit's twirp error codes, mapped so rejections surface as readable
# messages with a sensible status instead of opaque 500s.
TWIRP_STATUS = {
    "invalid_argument": 400,
    "not_found": 404,
    "already_exists": 409,
    "permission_denied": 403,
    "resource_exhausted": 429,
}


@app.exception_handler(TwirpError)
async def twirp_error(request: Request, error: TwirpError):
    return JSONResponse(
        {"detail": f"LiveKit: {error.message}"},
        status_code=TWIRP_STATUS.get(error.code, 502),
    )


@app.get("/health")
def health():
    return {"status": "ok"}


# Registered last: its catch-all route must come after every real one.
mount_spa(app)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
