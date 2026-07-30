import { CircleAlert } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export function JsonEditor({
  value,
  onChange,
  error,
  hint,
}: {
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
}) {
  return (
    <div className="space-y-2">
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      <Textarea
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[420px] font-mono text-xs leading-relaxed"
      />
      {error ? (
        <p className="text-destructive flex items-center gap-1.5 text-xs">
          <CircleAlert className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
