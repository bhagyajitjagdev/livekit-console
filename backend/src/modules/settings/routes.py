from fastapi import APIRouter, HTTPException
from livekit import api

from config import settings
from src.livekit_api import client, configured

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _mask(key: str) -> str:
    if len(key) <= 12:
        return "•" * len(key)
    return f"{key[:6]}…{key[-4:]}"


@router.get("/connection")
def get_connection():
    """The configured server, with the key masked — the secret never leaves
    the backend at all."""
    return {
        "url": settings.livekit_url,
        "apiKey": _mask(settings.livekit_api_key),
        "config": {
            "url": bool(settings.livekit_url),
            "apiKey": bool(settings.livekit_api_key),
            "apiSecret": bool(settings.livekit_api_secret),
        },
        "configured": configured(),
    }


@router.get("/test")
async def test_connection():
    try:
        await client().room.list_rooms(api.ListRoomsRequest())
        return {"ok": True}
    except HTTPException:
        raise  # the not-configured 503 passes through untouched
    except Exception as error:  # TwirpError, DNS, timeouts — report, don't 500
        return {"ok": False, "error": str(error)}
