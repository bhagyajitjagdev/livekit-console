import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/page-header"
import { StatGrid } from "@/components/overview/stat-grid"
import { LiveCalls } from "@/components/overview/live-calls"
import { overviewQuery } from "@/lib/queries"
import { useRefetchInterval } from "@/hooks/use-refetch-interval"

const empty = {
  counts: {
    rooms: 0,
    participants: 0,
    inboundTrunks: 0,
    outboundTrunks: 0,
    dispatchRules: 0,
    activeEgress: 0,
  },
  rooms: [],
}

export const Route = createFileRoute("/_authed/")({
  component: OverviewPage,
})

function OverviewPage() {
  const refetchInterval = useRefetchInterval()
  const { data } = useQuery({ ...overviewQuery, refetchInterval })
  const { counts, rooms } = data ?? empty

  return (
    <>
      <PageHeader title="Overview" />
      <div className="grid gap-4 p-4">
        <StatGrid counts={counts} />
        <LiveCalls rooms={rooms} />
      </div>
    </>
  )
}
