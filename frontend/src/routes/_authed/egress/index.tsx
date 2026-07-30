import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/page-header"
import { EgressList } from "@/components/egress/egress-list"
import { RefreshButton } from "@/components/refresh-button"
import { egressQuery } from "@/lib/queries"
import { useRefetchInterval } from "@/hooks/use-refetch-interval"

export const Route = createFileRoute("/_authed/egress/")({
  component: EgressPage,
})

function EgressPage() {
  const refetchInterval = useRefetchInterval()
  const { data } = useQuery({ ...egressQuery, refetchInterval })
  const { live, past } = data ?? { live: [], past: [] }

  return (
    <>
      <PageHeader title="Egress" />
      <div className="grid gap-4 p-4">
        <EgressList
          title="Recording"
          description="Calls being captured right now"
          items={live}
          emptyLabel="Nothing recording"
          action={<RefreshButton />}
        />
        <EgressList
          title="Recent"
          description="Completed and failed recordings LiveKit still has on record"
          items={past}
          emptyLabel="No recent recordings"
        />
      </div>
    </>
  )
}
