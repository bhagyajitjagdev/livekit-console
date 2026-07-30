import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/page-header"
import { DispatchRuleList } from "@/components/dispatch-rules/dispatch-rule-list"
import { dispatchRulesQuery, trunksQuery } from "@/lib/queries"
import { useRefetchInterval } from "@/hooks/use-refetch-interval"

export const Route = createFileRoute("/_authed/dispatch-rules/")({
  component: DispatchRulesPage,
})

function DispatchRulesPage() {
  const refetchInterval = useRefetchInterval()
  const { data: rules } = useQuery({ ...dispatchRulesQuery, refetchInterval })
  const { data: trunks } = useQuery(trunksQuery)

  return (
    <>
      <PageHeader title="Dispatch rules" />
      <div className="p-4">
        <DispatchRuleList
          rules={rules ?? []}
          trunks={trunks?.inbound ?? []}
        />
      </div>
    </>
  )
}
