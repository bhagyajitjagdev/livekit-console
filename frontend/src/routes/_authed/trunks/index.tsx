import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/page-header"
import { TrunkList } from "@/components/trunks/trunk-list"
import { trunksQuery } from "@/lib/queries"
import { useRefetchInterval } from "@/hooks/use-refetch-interval"

export const Route = createFileRoute("/_authed/trunks/")({
  component: TrunksPage,
})

function TrunksPage() {
  const refetchInterval = useRefetchInterval()
  const { data } = useQuery({ ...trunksQuery, refetchInterval })
  const { inbound, outbound } = data ?? { inbound: [], outbound: [] }

  return (
    <>
      <PageHeader title="Trunks" />
      <div className="grid gap-4 p-4">
        <TrunkList
          title="Inbound"
          direction="inbound"
          description="Carriers that deliver calls to this server"
          trunks={inbound}
        />
        <TrunkList
          title="Outbound"
          direction="outbound"
          description="Carriers this server places calls through"
          trunks={outbound}
        />
      </div>
    </>
  )
}
