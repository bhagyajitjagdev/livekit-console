import { useId } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRefreshPreference } from "@/lib/preferences"

/** On/off for polling. The interval itself stays in Settings. */
export function RefreshToggle() {
  const id = useId()
  const { enabled, seconds, setEnabled } = useRefreshPreference()

  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={id}
        className="text-muted-foreground gap-1.5 text-xs font-normal"
      >
        {enabled ? (
          <>
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
            />
            Live · {seconds}s
          </>
        ) : (
          "Paused"
        )}
      </Label>
      <Switch id={id} checked={enabled} onCheckedChange={setEnabled} />
    </div>
  )
}
