import { useState } from "react"
import { Bot, ChevronRight, MoreHorizontal, Waypoints } from "lucide-react"
import type { DispatchRule, InboundTrunk } from "@/lib/types"
import type { FlatRule, RuleKind } from "@/lib/livekit"
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
import { flattenRule, ruleAgents, timestampMs } from "@/lib/livekit"
import { copyToClipboard } from "@/lib/clipboard"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"
import { useConsole } from "@/hooks/use-console"

const kindLabel: Record<RuleKind, string> = {
  individual: "Individual",
  direct: "Direct",
  callee: "Callee",
}

/** Where a matched call lands, in the rule's own terms. */
function destination(flat: FlatRule): string {
  switch (flat.kind) {
    case "individual":
      return `${flat.roomPrefix}<caller>`
    case "callee":
      return `${flat.roomPrefix}<callee>${flat.randomize ? "-<random>" : ""}`
    default:
      return flat.roomName || "—"
  }
}

export function DispatchRuleRow({
  rule,
  trunks,
  onEdit,
}: {
  rule: DispatchRule
  trunks: Array<InboundTrunk>
  onEdit: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { run, pending } = useAction()
  const { readOnly } = useConsole()
  const flat = flattenRule(rule)
  const agents = ruleAgents(rule)

  const trunkNames = rule.trunkIds.map(
    (id) => trunks.find((t) => t.sipTrunkId === id)?.name ?? id
  )
  const createdAt = timestampMs(rule.createdAt)
  const updatedAt = timestampMs(rule.updatedAt)

  const fields = [
    { label: "Destination room", text: destination(flat) },
    { label: "Rule type", text: kindLabel[flat.kind] },
    {
      label: "Trunks",
      values: trunkNames,
      empty: "All inbound trunks",
    },
    {
      label: "Agents",
      values: agents.map((a) => a.agentName),
      empty: "No agent dispatched",
    },
    { label: "PIN", text: flat.pin, empty: "None" },
    { label: "Rule ID", text: rule.sipDispatchRuleId },
    {
      label: "Inbound numbers",
      values: rule.inboundNumbers.length ? rule.inboundNumbers : rule.numbers,
      empty: "Any dialled number",
    },
    {
      label: "Hide phone number",
      text: rule.hidePhoneNumber ? "Yes" : undefined,
      empty: "No",
    },
    {
      label: "Attributes",
      values: Object.entries(rule.attributes).map(([k, v]) => `${k}=${v}`),
      empty: "None",
    },
    { label: "Room preset", text: rule.roomPreset, empty: "None" },
    { label: "Metadata", text: rule.metadata, empty: "None" },
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
        className="-mx-(--card-spacing) flex cursor-pointer items-center gap-4 rounded-md px-(--card-spacing) py-2.5 transition-colors hover:bg-accent/50"
      >
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />

        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Waypoints className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{rule.name}</span>
            <Badge variant="outline">{kindLabel[flat.kind]}</Badge>
            {flat.pin ? <Badge variant="outline">PIN</Badge> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {trunkNames.length ? trunkNames.join(", ") : "All inbound trunks"}
          </p>
        </div>

        <div className="hidden font-mono text-sm text-muted-foreground sm:block">
          {destination(flat)}
        </div>

        <div className="flex w-28 items-center justify-end gap-1.5 text-sm text-muted-foreground">
          {agents.length ? (
            <>
              <Bot className="size-3.5" />
              <span className="truncate">
                {agents.map((a) => a.agentName).join(", ")}
              </span>
            </>
          ) : (
            "—"
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <MoreHorizontal />
                <span className="sr-only">Rule actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-40">
              <DropdownMenuItem disabled={readOnly} onClick={onEdit}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(rule.sipDispatchRuleId, "Rule ID")
                }
              >
                Copy rule ID
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
        title={`Delete ${rule.name}?`}
        description="Inbound calls matching this rule will be rejected until another rule covers them."
        confirmLabel="Delete rule"
        pending={pending}
        onConfirm={async () => {
          const ok = await run(
            () => api.delete(`/api/dispatch-rules/${rule.sipDispatchRuleId}`),
            {
              success: `${rule.name} deleted`,
              failure: "Couldn't delete the rule",
            },
          )
          if (ok) setConfirming(false)
        }}
      />
    </div>
  )
}
