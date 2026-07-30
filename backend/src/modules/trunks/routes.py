import asyncio

from fastapi import APIRouter, Body
from livekit import api

from src.livekit_api import client, parse, to_dict

router = APIRouter(prefix="/api/trunks", tags=["trunks"])


@router.get("")
async def list_trunks():
    lk = client()
    inbound, outbound = await asyncio.gather(
        lk.sip.list_sip_inbound_trunk(api.ListSIPInboundTrunkRequest()),
        lk.sip.list_sip_outbound_trunk(api.ListSIPOutboundTrunkRequest()),
    )
    return {
        "inbound": [to_dict(t) for t in inbound.items],
        "outbound": [to_dict(t) for t in outbound.items],
    }


@router.post("/inbound")
async def create_inbound_trunk(body: dict = Body(...)):
    """Body is CreateSIPInboundTrunkRequest JSON: {"trunk": {...}}."""
    request = parse(body, api.CreateSIPInboundTrunkRequest())
    return to_dict(await client().sip.create_sip_inbound_trunk(request))


@router.post("/outbound")
async def create_outbound_trunk(body: dict = Body(...)):
    """Body is CreateSIPOutboundTrunkRequest JSON: {"trunk": {...}}."""
    request = parse(body, api.CreateSIPOutboundTrunkRequest())
    return to_dict(await client().sip.create_sip_outbound_trunk(request))


@router.put("/inbound/{trunk_id}")
async def update_inbound_trunk(trunk_id: str, body: dict = Body(...)):
    """Body is the full SIPInboundTrunkInfo JSON — a replace, not a patch."""
    trunk = parse(body, api.SIPInboundTrunkInfo())
    return to_dict(await client().sip.update_sip_inbound_trunk(trunk_id, trunk))


@router.put("/outbound/{trunk_id}")
async def update_outbound_trunk(trunk_id: str, body: dict = Body(...)):
    """Body is the full SIPOutboundTrunkInfo JSON — a replace, not a patch."""
    trunk = parse(body, api.SIPOutboundTrunkInfo())
    return to_dict(await client().sip.update_sip_outbound_trunk(trunk_id, trunk))


@router.delete("/{trunk_id}")
async def delete_trunk(trunk_id: str):
    await client().sip.delete_sip_trunk(
        api.DeleteSIPTrunkRequest(sip_trunk_id=trunk_id)
    )
    return {"ok": True}
