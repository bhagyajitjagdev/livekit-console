import { useState } from "react"
import { ChevronRight, MoreHorizontal, PhoneIncoming, PhoneOutgoing } from "lucide-react"
import type { InboundTrunk, OutboundTrunk } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DetailGrid } from "@/components/detail-grid"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Time } from "@/components/time"
import { timestampMs, transportLabel } from "@/lib/livekit"
import { copyToClipboard } from "@/lib/clipboard"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"
import { useConsole } from "@/hooks/use-console"

function isOutbound(t: InboundTrunk | OutboundTrunk): t is OutboundTrunk {
  return "address" in t
}

export function TrunkRow({
  trunk,
  onEdit,
}: {
  trunk: InboundTrunk | OutboundTrunk
  onEdit: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { run, pending } = useAction()
  const { readOnly } = useConsole()
  const outbound = isOutbound(trunk)
  const Icon = outbound ? PhoneOutgoing : PhoneIncoming
  const createdAt = timestampMs(trunk.createdAt)
  const updatedAt = timestampMs(trunk.updatedAt)

  const shared = [
    { label: "Metadata", text: trunk.metadata, empty: "None" },
    {
      label: "Created",
      node: createdAt ? <Time at={createdAt} format="full" /> : undefined,
      empty: "—",
    },
    {
      label: "Updated",
      node: updatedAt ? <Time at={updatedAt} format="full" /> : undefined,
      empty: "—",
    },
  ]

  const fields = outbound
    ? [
        { label: "Numbers", values: trunk.numbers, empty: "Any" },
        { label: "Address", text: trunk.address },
        { label: "Transport", text: transportLabel(trunk.transport) },
        { label: "Auth user", text: trunk.authUsername, empty: "No auth" },
        ...shared,
      ]
    : [
        { label: "Numbers", values: trunk.numbers, empty: "Any" },
        {
          label: "Allowed addresses",
          values: trunk.allowedAddresses,
          empty: "Any source",
        },
        {
          label: "Allowed numbers",
          values: trunk.allowedNumbers,
          empty: "Any caller",
        },
        { label: "Auth user", text: trunk.authUsername, empty: "No auth" },
        ...shared,
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
            <span className="truncate text-sm font-medium">{trunk.name}</span>
            {trunk.authUsername ? <Badge variant="outline">Auth</Badge> : null}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {trunk.sipTrunkId}
          </p>
        </div>

        <div className="text-muted-foreground hidden text-sm sm:block">
          {outbound ? trunk.address : `${trunk.allowedAddresses.length} allowed`}
        </div>

        <div className="w-24 text-right text-sm font-medium tabular-nums">
          {trunk.numbers.length}{" "}
          <span className="text-muted-foreground font-normal">
            {trunk.numbers.length === 1 ? "number" : "numbers"}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreHorizontal />
                <span className="sr-only">Trunk actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-40">
              <DropdownMenuItem disabled={readOnly} onClick={onEdit}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => copyToClipboard(trunk.sipTrunkId, "Trunk ID")}
              >
                Copy trunk ID
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={readOnly}
                onClick={() => setConfirming(true)}
              >
                Delete
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
        title={`Delete ${trunk.name}?`}
        description={
          outbound
            ? "Campaigns dialling through this trunk will start failing."
            : "Calls arriving on this trunk will be rejected, and any dispatch rule scoped to it stops matching."
        }
        confirmLabel="Delete trunk"
        pending={pending}
        onConfirm={async () => {
          const ok = await run(
            () => api.delete(`/api/trunks/${trunk.sipTrunkId}`),
            {
              success: `${trunk.name} deleted`,
              failure: "Couldn't delete the trunk",
            },
          )
          if (ok) setConfirming(false)
        }}
      />
    </div>
  )
}
