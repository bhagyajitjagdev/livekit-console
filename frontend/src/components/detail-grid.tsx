import { Badge } from "@/components/ui/badge"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5 text-sm">{children}</div>
    </div>
  )
}

function Chips({ values, empty }: { values: Array<string>; empty: string }) {
  if (values.length === 0) {
    return <span className="text-muted-foreground text-sm">{empty}</span>
  }
  return (
    <>
      {values.map((v) => (
        <Badge key={v} variant="secondary" className="font-mono font-normal">
          {v}
        </Badge>
      ))}
    </>
  )
}

export function DetailGrid({
  fields,
}: {
  fields: Array<{
    label: string
    values?: Array<string>
    text?: string
    /** For values that must render client-side, such as timestamps. */
    node?: React.ReactNode
    empty?: string
  }>
}) {
  return (
    <div className="bg-card grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      {fields.map((f) => (
        <Field key={f.label} label={f.label}>
          {f.values ? (
            <Chips values={f.values} empty={f.empty ?? "None"} />
          ) : f.node ? (
            <span>{f.node}</span>
          ) : (
            <span className={f.text ? "" : "text-muted-foreground"}>
              {f.text || (f.empty ?? "Not set")}
            </span>
          )}
        </Field>
      ))}
    </div>
  )
}
