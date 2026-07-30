import { Link } from "@tanstack/react-router"
import {
  AudioLines,
  LayoutDashboard,
  PhoneCall,
  Radio,
  Settings,
  Waypoints,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/layout/user-menu"
import { BrandMark } from "@/components/brand-mark"

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/rooms", label: "Rooms", icon: Radio },
  { to: "/trunks", label: "Trunks", icon: PhoneCall },
  { to: "/dispatch-rules", label: "Dispatch rules", icon: Waypoints },
  { to: "/egress", label: "Egress", icon: AudioLines },
  { to: "/settings", label: "Settings", icon: Settings },
] as const

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="h-14 justify-center px-4">
        <div className="flex items-center gap-2">
          <BrandMark className="size-5 shrink-0" />
          <span className="text-sm font-semibold">LiveKit</span>
          <span className="text-muted-foreground text-sm">Console</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={to}
                      activeOptions={{ exact: to === "/" }}
                      activeProps={{ "data-active": true }}
                    >
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
