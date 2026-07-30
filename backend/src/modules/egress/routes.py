from fastapi import APIRouter
from livekit import api

from src.livekit_api import client, to_dict

router = APIRouter(prefix="/api/egress", tags=["egress"])

LIVE_STATUSES = {"EGRESS_STARTING", "EGRESS_ACTIVE"}


@router.get("")
async def list_egress():
    """All egress LiveKit still has on record, split live/past, newest first."""
    items = [
        to_dict(e)
        for e in (await client().egress.list_egress(api.ListEgressRequest())).items
    ]

    def started(egress: dict) -> int:
        return int(egress["startedAt"])

    live = [e for e in items if e["status"] in LIVE_STATUSES]
    past = [e for e in items if e["status"] not in LIVE_STATUSES]
    return {
        "live": sorted(live, key=started, reverse=True),
        "past": sorted(past, key=started, reverse=True),
    }


@router.post("/{egress_id}/stop")
async def stop_egress(egress_id: str):
    await client().egress.stop_egress(api.StopEgressRequest(egress_id=egress_id))
    return {"ok": True}
