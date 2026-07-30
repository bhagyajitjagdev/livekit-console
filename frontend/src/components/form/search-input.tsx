import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-64 pl-8 text-sm"
      />
    </div>
  )
}
