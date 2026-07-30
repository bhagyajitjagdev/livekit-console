import { RefreshCw } from "lucide-react"
import { useIsFetching, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const queryClient = useQueryClient()
  const fetching = useIsFetching() > 0

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={fetching}
      onClick={() => queryClient.invalidateQueries()}
    >
      <RefreshCw className={fetching ? "animate-spin" : ""} />
      Refresh
    </Button>
  )
}
