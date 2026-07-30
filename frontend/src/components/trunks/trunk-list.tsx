import { useState } from "react"
import { Plus } from "lucide-react"
import type { InboundTrunk, OutboundTrunk } from "@/lib/types"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrunkRow } from "@/components/trunks/trunk-row"
import { TrunkFormSheet } from "@/components/trunks/trunk-form-sheet"
import { SearchInput } from "@/components/form/search-input"
import { matches } from "@/lib/search"
import { useConsole } from "@/hooks/use-console"

export function TrunkList({
  title,
  description,
  direction,
  trunks,
}: {
  title: string
  description: string
  direction: "inbound" | "outbound"
  trunks: Array<InboundTrunk | OutboundTrunk>
}) {
  const [editing, setEditing] = useState<
    InboundTrunk | OutboundTrunk | undefined
  >()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { readOnly } = useConsole()

  const visible = trunks.filter((t) =>
    matches(
      query,
      t.name,
      t.sipTrunkId,
      t.numbers,
      "address" in t ? t.address : t.allowedAddresses
    )
  )

  const openFor = (trunk?: InboundTrunk | OutboundTrunk) => {
    setEditing(trunk)
    setOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
              {query ? "No trunks match" : "No trunks yet"}
            </p>
          ) : (
            visible.map((trunk) => (
              <TrunkRow
                key={trunk.sipTrunkId}
                trunk={trunk}
                onEdit={() => openFor(trunk)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <TrunkFormSheet
        direction={direction}
        trunk={editing}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
