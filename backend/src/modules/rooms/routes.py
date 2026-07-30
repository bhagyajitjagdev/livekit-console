from fastapi import APIRouter
from livekit import api

from src.livekit_api import client
from src.modules.rooms.service import rooms_with_participants

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("")
async def list_rooms():
    return await rooms_with_participants()


@router.delete("/{room_name}")
async def end_room(room_name: str):
    await client().room.delete_room(api.DeleteRoomRequest(room=room_name))
    return {"ok": True}


@router.delete("/{room_name}/participants/{identity}")
async def remove_participant(room_name: str, identity: str):
    await client().room.remove_participant(
        api.RoomParticipantIdentity(room=room_name, identity=identity)
    )
    return {"ok": True}
