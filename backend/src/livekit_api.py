"""Shared LiveKit client and protobuf <-> JSON helpers.

Requests and responses use LiveKit's own protobuf schema in canonical proto3
JSON form (camelCase keys, int64 as strings, enums by name). The console never
maintains its own copy of LiveKit's types, so SDK upgrades cannot drift from
what the API actually speaks.
"""

from fastapi import HTTPException
from google.protobuf.json_format import MessageToDict, ParseDict, ParseError
from livekit import api

from config import settings

_client: api.LiveKitAPI | None = None


def configured() -> bool:
    return bool(
        settings.livekit_url
        and settings.livekit_api_key
        and settings.livekit_api_secret
    )


def client() -> api.LiveKitAPI:
    """Lazy singleton — one aiohttp session for the app's lifetime."""
    global _client
    if _client is None:
        if not configured():
            raise HTTPException(
                status_code=503,
                detail="LiveKit is not configured: set LIVEKIT_URL, "
                "LIVEKIT_API_KEY and LIVEKIT_API_SECRET",
            )
        _client = api.LiveKitAPI(
            settings.livekit_url,
            settings.livekit_api_key,
            settings.livekit_api_secret,
        )
    return _client


async def close_client():
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def to_dict(message) -> dict:
    # Defaults are printed so response shapes stay stable field-to-field.
    return MessageToDict(message, always_print_fields_with_no_presence=True)


def parse(payload: dict, message):
    """LiveKit-schema JSON -> protobuf. 400 with the exact reason on mismatch."""
    try:
        return ParseDict(payload, message)
    except ParseError as error:
        raise HTTPException(status_code=400, detail=str(error))
