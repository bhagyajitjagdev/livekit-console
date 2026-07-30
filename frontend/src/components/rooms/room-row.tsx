import { useState } from "react"
import {
  ChevronRight,
  Circle,
  Disc,
  Globe,
  MoreHorizontal,
  Phone,
} from "lucide-react"
import type { RoomWithParticipants } from "@/lib/types"
import type { RoomKind } from "@/lib/room-kind"
import { Badge } from "@/components/ui/badge"
import { Elapsed, Time } from "@/components/time"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ParticipantCard } from "@/components/rooms/participant-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { agentNames, remoteNumber, roomKind, roomKindLabel } from "@/lib/room-kind"
import { roomCreatedAt } from "@/lib/livekit"
import { copyToClipboard } from "@/lib/clipboard"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"
import { useConsole } from "@/hooks/use-console"

const kindIcon: Record<RoomKind, React.ElementType> = {
  phone: Phone,
  web: Globe,
  empty: Circle,
  other: Circle,
}

export function RoomRow({ room }: { room: RoomWithParticipants }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { run, pending } = useAction()
  const { readOnly } = useConsole()
  const kind = roomKind(room)
  const Icon = kindIcon[kind]
  const remote = remoteNumber(room)
  const agents = agentNames(room)
  const createdAt = roomCreatedAt(room)

  return (
    <div className="py-1">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        className="hover:bg-accent/50 -mx-(--card-spacing) flex cursor-pointer items-center gap-4 rounded-md px-(--card-spacing) py-2.5 transition-colors"
      >
        <ChevronRight
          className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />

        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {remote ?? room.name}
            </span>
            <Badge variant="outline">{roomKindLabel[kind]}</Badge>
            {room.activeRecording ? (
              <Badge variant="secondary" className="gap-1">
                <Disc className="size-3" />
                REC
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {room.name}
            {agents.length ? ` · ${agents.join(", ")}` : ""}
          </p>
        </div>

        <div className="text-muted-foreground hidden text-sm sm:block">
          <Time at={createdAt} />
        </div>

        <div className="w-20 text-right text-sm font-medium tabular-nums">
          <Elapsed since={createdAt} />
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreHorizontal />
                <span className="sr-only">Room actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-40">
              <DropdownMenuItem
                onClick={() => copyToClipboard(room.name, "Room name")}
              >
                Copy room name
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => copyToClipboard(room.sid, "SID")}
              >
                Copy SID
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={readOnly}
                onClick={() => setConfirming(true)}
              >
                End room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {open ? (
        <div className="grid gap-2 pt-1 pb-3 pl-8">
          {room.participants.map((p) => (
            <ParticipantCard
              key={p.sid}
              participant={p}
              roomName={room.name}
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`End ${room.name}?`}
        description={
          room.numParticipants > 0
            ? `This disconnects all ${room.numParticipants} participants immediately. Any call in progress is cut off.`
            : "The room is closed immediately."
        }
        confirmLabel="End room"
        pending={pending}
        onConfirm={async () => {
          const ok = await run(
            () => api.delete(`/api/rooms/${encodeURIComponent(room.name)}`),
            {
              success: `${room.name} ended`,
              failure: "Couldn't end the room",
            },
          )
          if (ok) setConfirming(false)
        }}
      />
    </div>
  )
}
