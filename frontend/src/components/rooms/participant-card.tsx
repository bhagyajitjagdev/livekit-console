import { useState } from "react"
import {
  Bot,
  Cable,
  Globe,
  MicOff,
  Phone,
  Radio,
  UserMinus,
  Video,
  Waypoints,
} from "lucide-react"
import type { Participant } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Elapsed } from "@/components/time"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { participantJoinedAt } from "@/lib/livekit"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"
import { useConsole } from "@/hooks/use-console"

/** Keyed by LiveKit's enum names; unknown kinds fall back to a globe. */
const kindIcon: Record<string, React.ElementType> = {
  SIP: Phone,
  AGENT: Bot,
  STANDARD: Globe,
  EGRESS: Video,
  INGRESS: Radio,
  CONNECTOR: Cable,
  BRIDGE: Waypoints,
}

export function ParticipantCard({
  participant,
  roomName,
}: {
  participant: Participant
  roomName: string
}) {
  const [confirming, setConfirming] = useState(false)
  const { run, pending } = useAction()
  const { readOnly } = useConsole()
  const Icon = kindIcon[participant.kind] ?? Globe
  const muted = participant.tracks.some((t) => t.muted)
  const status =
    participant.attributes["sip.callStatus"] ?? participant.state.toLowerCase()

  return (
    <div className="bg-card flex items-center gap-3 rounded-lg border p-3">
      <div className="text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{participant.name || participant.identity}</p>
        <p className="text-muted-foreground truncate text-[11px] tracking-wide uppercase">
          {participant.tracks.length}{" "}
          {participant.tracks.length === 1 ? "track" : "tracks"}
          {muted ? " · muted" : ""} · {participant.identity}
        </p>
      </div>

      {muted ? <MicOff className="text-muted-foreground size-3.5" /> : null}

      <Badge variant="outline" className="uppercase">
        {participant.kind}
      </Badge>

      <div className="w-16 text-right">
        <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
          {status}
        </p>
        <p className="text-sm font-medium tabular-nums">
          <Elapsed since={participantJoinedAt(participant)} />
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        disabled={readOnly}
        onClick={() => setConfirming(true)}
      >
        <UserMinus />
        <span className="sr-only">Remove {participant.identity}</span>
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${participant.name || participant.identity}?`}
        description={`${participant.identity} is disconnected from ${roomName} immediately.`}
        confirmLabel="Remove"
        pending={pending}
        onConfirm={async () => {
          const ok = await run(
            () =>
              api.delete(
                `/api/rooms/${encodeURIComponent(roomName)}/participants/${encodeURIComponent(participant.identity)}`,
              ),
            {
              success: `${participant.name || participant.identity} removed`,
              failure: "Couldn't remove the participant",
            },
          )
          if (ok) setConfirming(false)
        }}
      />
    </div>
  )
}
