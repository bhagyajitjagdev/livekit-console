import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { GithubLink } from "@/components/github-link"
import { RefreshToggle } from "@/components/refresh-toggle"
import { useConsole } from "@/hooks/use-console"

export function PageHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  const { readOnly } = useConsole()

  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-center"
      />
      <h1 className="text-base font-medium">{title}</h1>
      {readOnly ? (
        <Badge variant="outline" className="gap-1">
          <Eye className="size-3" />
          Read only
        </Badge>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {action}
        <RefreshToggle />
        <Separator
          orientation="vertical"
          className="data-vertical:h-4 data-vertical:self-center"
        />
        <div className="flex items-center gap-0.5">
          <GithubLink />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
