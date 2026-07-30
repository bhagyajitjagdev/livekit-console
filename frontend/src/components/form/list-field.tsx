import { Plus, X } from "lucide-react"
import type { FieldValues, UseFieldArrayReturn, UseFormRegister } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ListField<T extends FieldValues>({
  label,
  hint,
  placeholder,
  name,
  fieldArray,
  register,
}: {
  label: string
  hint?: string
  placeholder?: string
  name: string
  fieldArray: UseFieldArrayReturn<T, never, "id">
  register: UseFormRegister<T>
}) {
  const { fields, append, remove } = fieldArray

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}

      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder={placeholder}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...register(`${name}.${i}.value` as any)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              disabled={fields.length === 1}
            >
              <X />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={() => append({ value: "" } as any)}
      >
        <Plus />
        Add
      </Button>
    </div>
  )
}
