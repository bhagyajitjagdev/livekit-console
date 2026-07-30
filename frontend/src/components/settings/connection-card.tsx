import { useState } from "react"
import { toast } from "sonner"
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react"
import type { Connection } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DetailGrid } from "@/components/detail-grid"
import { api } from "@/lib/api"

type ConnectionStatus = "unknown" | "checking" | "ok" | "error"

export function ConnectionCard({ connection }: { connection: Connection }) {
  const [status, setStatus] = useState<ConnectionStatus>("unknown")

  const test = async () => {
    setStatus("checking")
    try {
      const result = await api.get<{ ok: boolean; error?: string }>(
        "/api/settings/test",
      )
      setStatus(result.ok ? "ok" : "error")
      if (result.ok) {
        toast.success("LiveKit responded")
      } else {
        toast.error("Couldn't reach LiveKit", { description: result.error })
      }
    } catch (error) {
      setStatus("error")
      toast.error("Couldn't reach LiveKit", {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
        <CardDescription>
          The LiveKit server this console manages
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          {status === "ok" ? (
            <Badge variant="secondary" className="gap-1">
              <CircleCheck className="size-3" />
              Reachable
            </Badge>
          ) : null}
          {status === "error" ? (
            <Badge variant="destructive" className="gap-1">
              <CircleAlert className="size-3" />
              Unreachable
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={test}
            disabled={status === "checking"}
          >
            {status === "checking" ? (
              <Loader2 className="animate-spin" />
            ) : null}
            Test connection
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <DetailGrid
          fields={[
            { label: "URL", text: connection.url },
            { label: "API key", text: connection.apiKey },
            { label: "API secret", empty: "••••••••" },
          ]}
        />
      </CardContent>
    </Card>
  )
}
