import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Check, Loader2, X } from "lucide-react"
import type { ConfigStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const variables: Array<{ key: keyof ConfigStatus; name: string; hint: string }> =
  [
    { key: "url", name: "LIVEKIT_URL", hint: "wss://xyz.livekit.cloud" },
    { key: "apiKey", name: "LIVEKIT_API_KEY", hint: "starts with API" },
    { key: "apiSecret", name: "LIVEKIT_API_SECRET", hint: "kept server-side" },
  ]

export function ConfigGate({ config }: { config: ConfigStatus }) {
  const queryClient = useQueryClient()
  const [checking, setChecking] = useState(false)

  const recheck = async () => {
    setChecking(true)
    await queryClient.invalidateQueries()
    setChecking(false)
  }

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-background/60 supports-backdrop-filter:backdrop-blur-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>LiveKit is not configured</DialogTitle>
          <DialogDescription>
            Set the missing variables in <code>.env</code> and restart the
            server. Nothing on this console works until all three are present.
          </DialogDescription>
        </DialogHeader>

        <ul className="grid gap-2">
          {variables.map(({ key, name, hint }) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              {config[key] ? (
                <Check className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <X className="size-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm">{name}</p>
                <p className="text-muted-foreground text-xs">
                  {config[key] ? "Set" : hint}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={recheck} disabled={checking}>
            {checking ? <Loader2 className="animate-spin" /> : null}
            Check again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
