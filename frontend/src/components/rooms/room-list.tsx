import { useState } from "react"
import type { RoomWithParticipants } from "@/lib/types"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RoomRow } from "@/components/rooms/room-row"
import { RefreshButton } from "@/components/refresh-button"
import { SearchInput } from "@/components/form/search-input"
import { matches } from "@/lib/search"

export function RoomList({ rooms }: { rooms: Array<RoomWithParticipants> }) {
  const [query, setQuery] = useState("")

  const visible = rooms.filter((room) =>
    matches(
      query,
      room.name,
      room.sid,
      room.participants.map((p) => p.identity),
      room.participants.map((p) => p.name)
    )
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active rooms</CardTitle>
        <CardDescription>
          {rooms.length} {rooms.length === 1 ? "call" : "calls"} in progress
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search calls..."
          />
          <RefreshButton />
        </CardAction>
      </CardHeader>

      <CardContent className="divide-y">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {query ? "No calls match" : "No active calls"}
          </p>
        ) : (
          visible.map((room) => <RoomRow key={room.sid} room={room} />)
        )}
      </CardContent>
    </Card>
  )
}
