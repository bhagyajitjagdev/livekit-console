import asyncio

from livekit import api
from livekit.api import TwirpError

from src.livekit_api import client, to_dict


async def _participants(room_name: str):
    """The room's participants, or None when the room no longer exists."""
    try:
        response = await client().room.list_participants(
            api.ListParticipantsRequest(room=room_name)
        )
    except TwirpError as error:
        # LiveKit closes a room the moment its last participant leaves, so a
        # room from the list may be gone by the time it is asked about. That
        # is not an error — the room has simply ended.
        if error.code == "not_found":
            return None
        raise
    return [to_dict(p) for p in response.participants]


async def rooms_with_participants():
    """Every live room with its participants, newest first. Rooms that end
    mid-listing are dropped instead of failing the whole page."""
    rooms = (await client().room.list_rooms(api.ListRoomsRequest())).rooms

    participants = await asyncio.gather(
        *(_participants(room.name) for room in rooms)
    )

    detailed = [
        {**to_dict(room), "participants": found}
        for room, found in zip(rooms, participants)
        if found is not None
    ]
    return sorted(detailed, key=lambda r: int(r["creationTime"]), reverse=True)
