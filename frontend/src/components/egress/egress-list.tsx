import { useState } from "react"
import type { Egress } from "@/lib/types"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EgressRow } from "@/components/egress/egress-row"
import { SearchInput } from "@/components/form/search-input"
import { egressFile } from "@/lib/livekit"
import { matches } from "@/lib/search"

export function EgressList({
  title,
  description,
  items,
  emptyLabel,
  action,
}: {
  title: string
  description: string
  items: Array<Egress>
  emptyLabel: string
  action?: React.ReactNode
}) {
  const [query, setQuery] = useState("")

  const visible = items.filter((e) => {
    const file = egressFile(e)
    return matches(
      query,
      e.roomName,
      e.egressId,
      e.status,
      file?.filename,
      file?.location
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} />
          {action}
        </CardAction>
      </CardHeader>

      <CardContent className="divide-y">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {query ? "No recordings match" : emptyLabel}
          </p>
        ) : (
          visible.map((egress) => (
            <EgressRow key={egress.egressId} egress={egress} />
          ))
        )}
      </CardContent>
    </Card>
  )
}
