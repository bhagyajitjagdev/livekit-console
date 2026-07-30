import asyncio

from fastapi import APIRouter
from livekit import api

from src.livekit_api import client
from src.modules.rooms.service import rooms_with_participants

router = APIRouter(prefix="/api/overview", tags=["overview"])


@router.get("")
async def get_overview():
    """One batch for the whole page: counts for every section plus the live
    room list, so the dashboard needs a single request per refresh."""
    lk = client()

    rooms, inbound, outbound, rules, active_egress = await asyncio.gather(
        rooms_with_participants(),
        lk.sip.list_sip_inbound_trunk(api.ListSIPInboundTrunkRequest()),
        lk.sip.list_sip_outbound_trunk(api.ListSIPOutboundTrunkRequest()),
        lk.sip.list_sip_dispatch_rule(api.ListSIPDispatchRuleRequest()),
        lk.egress.list_egress(api.ListEgressRequest(active=True)),
    )

    return {
        "counts": {
            "rooms": len(rooms),
            "participants": sum(room["numParticipants"] for room in rooms),
            "inboundTrunks": len(inbound.items),
            "outboundTrunks": len(outbound.items),
            "dispatchRules": len(rules.items),
            "activeEgress": len(active_egress.items),
        },
        "rooms": rooms,
    }
