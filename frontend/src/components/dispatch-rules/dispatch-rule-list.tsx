import { useState } from "react"
import { Plus } from "lucide-react"
import type { DispatchRule, InboundTrunk } from "@/lib/types"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DispatchRuleRow } from "@/components/dispatch-rules/dispatch-rule-row"
import { DispatchRuleFormSheet } from "@/components/dispatch-rules/dispatch-rule-form-sheet"
import { SearchInput } from "@/components/form/search-input"
import { flattenRule, ruleAgents } from "@/lib/livekit"
import { matches } from "@/lib/search"
import { useConsole } from "@/hooks/use-console"

export function DispatchRuleList({
  rules,
  trunks,
}: {
  rules: Array<DispatchRule>
  trunks: Array<InboundTrunk>
}) {
  const [editing, setEditing] = useState<DispatchRule | undefined>()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { readOnly } = useConsole()

  const visible = rules.filter((r) => {
    const flat = flattenRule(r)
    return matches(
      query,
      r.name,
      r.sipDispatchRuleId,
      r.metadata,
      r.inboundNumbers,
      flat.roomPrefix,
      flat.roomName,
      ruleAgents(r).map((a) => a.agentName),
      r.trunkIds.map(
        (id) => trunks.find((t) => t.sipTrunkId === id)?.name ?? id
      )
    )
  })

  const openFor = (rule?: DispatchRule) => {
    setEditing(rule)
    setOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Dispatch rules</CardTitle>
          <CardDescription>
            Where inbound calls land, and which agent answers
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <SearchInput value={query} onChange={setQuery} />
            <Button
              variant="outline"
              size="sm"
              disabled={readOnly}
              onClick={() => openFor()}
            >
              <Plus />
              New
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="divide-y">
          {visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {query
                ? "No rules match"
                : "No dispatch rules — inbound calls have nowhere to go"}
            </p>
          ) : (
            visible.map((rule) => (
              <DispatchRuleRow
                key={rule.sipDispatchRuleId}
                rule={rule}
                trunks={trunks}
                onEdit={() => openFor(rule)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <DispatchRuleFormSheet
        rule={editing}
        trunks={trunks}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
