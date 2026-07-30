import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  REFRESH_OPTIONS,
  refreshLabel,
  useRefreshPreference,
} from "@/lib/preferences"

export function PreferencesCard() {
  const { enabled, seconds, setEnabled, setSeconds } = useRefreshPreference()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Stored in this browser only</CardDescription>
      </CardHeader>

      <CardContent className="grid max-w-sm gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="auto-refresh">Auto-refresh</Label>
          <Switch
            id="auto-refresh"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Interval</Label>
          <p className="text-muted-foreground text-xs">
            How often Rooms and Egress reload while open.
          </p>
          <Select
            value={String(seconds)}
            onValueChange={(next) => setSeconds(Number(next))}
            disabled={!enabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {refreshLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
