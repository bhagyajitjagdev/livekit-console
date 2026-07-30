import { useState } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type MultiSelectOption = {
  value: string
  label: string
  hint?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No results found.",
  className,
}: {
  options: Array<MultiSelectOption>
  selected: Array<string>
  onChange: (selected: Array<string>) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    )

  const labelFor = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : selected.length <= 2 ? (
              selected.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="max-w-[140px] truncate px-1.5 py-0 text-[11px]"
                >
                  {labelFor(v)}
                </Badge>
              ))
            ) : (
              <span className="text-sm">{selected.length} selected</span>
            )}
          </span>

          <span className="flex shrink-0 items-center gap-1">
            {selected.length > 0 ? (
              <X
                className="text-muted-foreground hover:text-foreground size-3.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange([])
                }}
              />
            ) : null}
            <ChevronDown className="text-muted-foreground size-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.hint ?? ""}`}
                    onSelect={() => toggle(option.value)}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                    </div>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {option.hint}
                      </span>
                    ) : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
