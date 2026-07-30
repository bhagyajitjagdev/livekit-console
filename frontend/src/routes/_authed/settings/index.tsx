import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/page-header"
import { ConnectionCard } from "@/components/settings/connection-card"
import { PreferencesCard } from "@/components/settings/preferences-card"
import { connectionQuery } from "@/lib/queries"

export const Route = createFileRoute("/_authed/settings/")({
  component: SettingsPage,
})

function SettingsPage() {
  const { data: connection } = useQuery(connectionQuery)

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 p-4">
        {connection ? <ConnectionCard connection={connection} /> : null}
        <PreferencesCard />
      </div>
    </>
  )
}
