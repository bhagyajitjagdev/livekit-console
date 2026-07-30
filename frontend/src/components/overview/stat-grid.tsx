import { Link } from "@tanstack/react-router"
import type { EnvironmentCounts } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { key: "rooms", label: "Active calls", to: "/rooms" },
  { key: "participants", label: "Participants", to: "/rooms" },
  { key: "activeEgress", label: "Recording", to: "/egress" },
  { key: "inboundTrunks", label: "Inbound trunks", to: "/trunks" },
  { key: "outboundTrunks", label: "Outbound trunks", to: "/trunks" },
  { key: "dispatchRules", label: "Dispatch rules", to: "/dispatch-rules" },
] as const satisfies ReadonlyArray<{
  key: keyof EnvironmentCounts
  label: string
  to: string
}>

export function StatGrid({ counts }: { counts: EnvironmentCounts }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map(({ key, label, to }) => (
        <Card key={key} className="transition-colors hover:border-ring">
          <CardContent>
            <Link to={to} className="block space-y-1">
              <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {label}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {counts[key]}
              </p>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
