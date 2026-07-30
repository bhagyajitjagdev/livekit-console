import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ConfigGate } from "@/components/config-gate"
import { connectionQuery, meQuery } from "@/lib/queries"

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQuery)
    if (!me.user) {
      throw redirect({ to: "/login", search: { next: location.href } })
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { data: connection } = useQuery(connectionQuery)

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
      {connection && !connection.configured ? (
        <ConfigGate config={connection.config} />
      ) : null}
    </>
  )
}
