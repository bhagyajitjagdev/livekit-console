import asyncio

from fastapi import APIRouter
from livekit import api

from src.livekit_api import client, to_dict

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("")
async def list_rooms():
    """Every active room with its participants, newest first."""
    lk = client()
    rooms = (await lk.room.list_rooms(api.ListRoomsRequest())).rooms

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
    return sorted(detailed, key=lambda r: int(r["creationTime"]), reverse=True)


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
