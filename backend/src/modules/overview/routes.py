import asyncio

from fastapi import APIRouter
from livekit import api

from src.livekit_api import client, to_dict

router = APIRouter(prefix="/api/overview", tags=["overview"])


@router.get("")
async def get_overview():
    """One batch for the whole page: counts for every section plus the live
    room list, so the dashboard needs a single request per refresh."""
    lk = client()

    rooms_resp, inbound, outbound, rules, active_egress = await asyncio.gather(
        lk.room.list_rooms(api.ListRoomsRequest()),
        lk.sip.list_sip_inbound_trunk(api.ListSIPInboundTrunkRequest()),
        lk.sip.list_sip_outbound_trunk(api.ListSIPOutboundTrunkRequest()),
        lk.sip.list_sip_dispatch_rule(api.ListSIPDispatchRuleRequest()),
        lk.egress.list_egress(api.ListEgressRequest(active=True)),
    )
    rooms = rooms_resp.rooms

    participants = await asyncio.gather(
        *(
            lk.room.list_participants(api.ListParticipantsRequest(room=room.name))
            for room in rooms
        )
    )
    detailed = [
        {**to_dict(room), "participants": [to_dict(p) for p in resp.participants]}
        for room, resp in zip(rooms, participants)
    ]

    return {
        "counts": {
            "rooms": len(rooms),
            "participants": sum(room.num_participants for room in rooms),
            "inboundTrunks": len(inbound.items),
            "outboundTrunks": len(outbound.items),
            "dispatchRules": len(rules.items),
            "activeEgress": len(active_egress.items),
        },
        "rooms": sorted(
            detailed, key=lambda r: int(r["creationTime"]), reverse=True
        ),
    }
