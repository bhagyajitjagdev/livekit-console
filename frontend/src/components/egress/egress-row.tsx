import { useState } from "react"
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Disc,
  MoreHorizontal,
  Square,
} from "lucide-react"
import type { Egress } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DetailGrid } from "@/components/detail-grid"
import { Elapsed, Time } from "@/components/time"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  egressAudioOnly,
  egressFile,
  egressLive,
  egressStatusLabel,
  nanosToMs,
} from "@/lib/livekit"
import { formatBytes, formatDuration } from "@/lib/format"
import { copyToClipboard } from "@/lib/clipboard"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"
import { useConsole } from "@/hooks/use-console"

const statusIcon: Record<string, React.ElementType> = {
  EGRESS_STARTING: Disc,
  EGRESS_ACTIVE: Disc,
  EGRESS_ENDING: Square,
  EGRESS_COMPLETE: CircleCheck,
  EGRESS_FAILED: CircleAlert,
  EGRESS_ABORTED: CircleAlert,
  EGRESS_LIMIT_REACHED: CircleAlert,
}

function statusVariant(egress: Egress) {
  if (egressLive(egress)) return "secondary" as const
  if (egress.status === "EGRESS_COMPLETE") return "outline" as const
  return "destructive" as const
}

export function EgressRow({ egress }: { egress: Egress }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { run, pending } = useAction()
  const { readOnly } = useConsole()
  const Icon = statusIcon[egress.status] ?? CircleAlert
  const live = egressLive(egress)
  const startedAt = nanosToMs(egress.startedAt)
  const endedAt = egress.endedAt !== "0" ? nanosToMs(egress.endedAt) : undefined
  const file = egressFile(egress)
  const error = egress.error || undefined

  const storage = file
    ? [file.backend.toUpperCase(), file.region].filter(Boolean).join(" · ")
    : undefined

  const fields = [
    { label: "Room", text: egress.roomName },
    { label: "Egress ID", text: egress.egressId },
    { label: "Started", node: <Time at={startedAt} format="full" /> },
    {
      label: "Ended",
      node: endedAt ? <Time at={endedAt} format="full" /> : undefined,
      empty: live ? "Still recording" : "—",
    },
    {
      label: "Duration",
      node: live ? (
        <Elapsed since={startedAt} />
      ) : endedAt ? (
        formatDuration(endedAt - startedAt)
      ) : undefined,
      empty: "—",
    },
    { label: "Storage", text: storage, empty: "—" },
    {
      label: "Size",
      text: file?.size ? formatBytes(file.size) : undefined,
      empty: "Not reported",
    },
    { label: "Output", text: file?.location, empty: "No file output" },
    ...(error ? [{ label: "Error", text: error }] : []),
  ]

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
            <span className="truncate text-sm font-medium">{egress.roomName}</span>
            <Badge variant={statusVariant(egress)}>
              {egressStatusLabel(egress.status)}
            </Badge>
            {egressAudioOnly(egress) ? (
              <Badge variant="outline">Audio</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {error ?? file?.filename ?? egress.egressId}
          </p>
        </div>

        <div className="text-muted-foreground hidden text-sm whitespace-nowrap sm:block">
          <Time at={startedAt} format="short" />
        </div>

        <div className="w-20 text-right text-sm font-medium tabular-nums">
          {live ? (
            <Elapsed since={startedAt} />
          ) : endedAt ? (
            formatDuration(endedAt - startedAt)
          ) : (
            "—"
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreHorizontal />
                <span className="sr-only">Egress actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-40">
              <DropdownMenuItem
                onClick={() => copyToClipboard(egress.egressId, "Egress ID")}
              >
                Copy egress ID
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!file}
                onClick={() =>
                  file && copyToClipboard(file.location, "Output path")
                }
              >
                Copy output path
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={!live || readOnly}
                onClick={() => setConfirming(true)}
              >
                Stop recording
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {open ? (
        <div className="pt-1 pb-3 pl-8">
          <DetailGrid fields={fields} />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Stop this recording?"
        description={`The recording of ${egress.roomName} is finalised and uploaded as-is. The call itself keeps running.`}
        confirmLabel="Stop recording"
        pending={pending}
        onConfirm={async () => {
          const ok = await run(
            () => api.post(`/api/egress/${egress.egressId}/stop`),
            {
              success: "Recording stopped",
              failure: "Couldn't stop the recording",
            },
          )
          if (ok) setConfirming(false)
        }}
      />
    </div>
  )
}
