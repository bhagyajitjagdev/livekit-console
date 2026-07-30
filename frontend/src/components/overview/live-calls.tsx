import { Link } from "@tanstack/react-router"
import { Bot, Circle, Disc, Globe, Phone } from "lucide-react"
import type { RoomWithParticipants } from "@/lib/types"
import type { RoomKind } from "@/lib/room-kind"
import { Badge } from "@/components/ui/badge"
import { Elapsed } from "@/components/time"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { agentNames, remoteNumber, roomKind } from "@/lib/room-kind"
import { roomCreatedAt } from "@/lib/livekit"

const kindIcon: Record<RoomKind, React.ElementType> = {
  phone: Phone,
  web: Globe,
  empty: Circle,
  other: Circle,
}

function CallRow({ room }: { room: RoomWithParticipants }) {
  const Icon = kindIcon[roomKind(room)]
  const remote = remoteNumber(room)
  const agents = agentNames(room)

  return (
    <div className="flex items-center gap-4 py-2.5">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {remote ?? room.name}
          </span>
          {room.activeRecording ? (
            <Badge variant="secondary" className="gap-1">
              <Disc className="size-3" />
              REC
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground truncate text-xs">{room.name}</p>
      </div>

      <div className="text-muted-foreground hidden w-40 items-center gap-1.5 text-sm sm:flex">
        {agents.length ? (
          <>
            <Bot className="size-3.5 shrink-0" />
            <span className="truncate">{agents.join(", ")}</span>
          </>
        ) : (
          "—"
        )}
      </div>

      <div className="w-16 text-right text-sm font-medium tabular-nums">
        <Elapsed since={roomCreatedAt(room)} />
      </div>
    </div>
  )
}

export function LiveCalls({ rooms }: { rooms: Array<RoomWithParticipants> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live now</CardTitle>
        <CardDescription>
          {rooms.length} {rooms.length === 1 ? "call" : "calls"} in progress
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/rooms">Open Rooms</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="divide-y">
        {rooms.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No active calls
          </p>
        ) : (
          rooms.map((room) => <CallRow key={room.sid} room={room} />)
        )}
      </CardContent>
    </Card>
  )
}
