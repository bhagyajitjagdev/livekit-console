import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { LogOut, User } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useConsole } from "@/hooks/use-console"
import { api } from "@/lib/api"

export function UserMenu() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useConsole()
  const [pending, setPending] = useState(false)

  const signOut = async () => {
    setPending(true)
    try {
      await api.post("/api/auth/logout")
      // Everything cached belongs to the signed-in session — drop it all.
      queryClient.removeQueries()
      await router.navigate({ to: "/login" })
    } finally {
      setPending(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton disabled={pending} onClick={signOut}>
          <User />
          <span className="truncate">{user}</span>
          <LogOut className="ml-auto size-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
