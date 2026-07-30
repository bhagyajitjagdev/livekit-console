from fastapi import APIRouter, Body
from livekit import api

from src.livekit_api import client, parse, to_dict

router = APIRouter(prefix="/api/dispatch-rules", tags=["dispatch-rules"])


@router.get("")
async def list_dispatch_rules():
    rules = await client().sip.list_sip_dispatch_rule(
        api.ListSIPDispatchRuleRequest()
    )
    return [to_dict(rule) for rule in rules.items]


@router.post("")
async def create_dispatch_rule(body: dict = Body(...)):
    """Body is CreateSIPDispatchRuleRequest JSON: {"dispatchRule": {...}}."""
    request = parse(body, api.CreateSIPDispatchRuleRequest())
    return to_dict(await client().sip.create_sip_dispatch_rule(request))


@router.put("/{rule_id}")
async def update_dispatch_rule(rule_id: str, body: dict = Body(...)):
    """Body is the full SIPDispatchRuleInfo JSON — a replace, which is the
    only way to touch roomConfig (agents), as the field-patch API cannot."""
    rule = parse(body, api.SIPDispatchRuleInfo())
    return to_dict(await client().sip.update_sip_dispatch_rule(rule_id, rule))


@router.delete("/{rule_id}")
async def delete_dispatch_rule(rule_id: str):
    await client().sip.delete_sip_dispatch_rule(
        api.DeleteSIPDispatchRuleRequest(sip_dispatch_rule_id=rule_id)
    )
    return {"ok": True}
