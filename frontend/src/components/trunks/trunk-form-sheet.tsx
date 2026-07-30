import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import type { InboundTrunk, OutboundTrunk } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListField } from "@/components/form/list-field"
import { JsonEditor } from "@/components/form/json-editor"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"

type Direction = "inbound" | "outbound"

const TRANSPORTS = [
  { value: "SIP_TRANSPORT_AUTO", label: "Auto" },
  { value: "SIP_TRANSPORT_UDP", label: "UDP" },
  { value: "SIP_TRANSPORT_TCP", label: "TCP" },
  { value: "SIP_TRANSPORT_TLS", label: "TLS" },
]

type FormValues = {
  name: string
  numbers: Array<{ value: string }>
  allowedAddresses: Array<{ value: string }>
  allowedNumbers: Array<{ value: string }>
  address: string
  transport: string
  authUsername: string
  authPassword: string
}

const empty: FormValues = {
  name: "",
  numbers: [{ value: "" }],
  allowedAddresses: [{ value: "" }],
  allowedNumbers: [{ value: "" }],
  address: "",
  transport: "SIP_TRANSPORT_AUTO",
  authUsername: "",
  authPassword: "",
}

const toRows = (values: Array<string> | undefined) =>
  values?.length ? values.map((value) => ({ value })) : [{ value: "" }]

const toList = (rows: Array<{ value: string }>) =>
  rows.map((r) => r.value.trim()).filter(Boolean)

/** The trunk object as LiveKit stores it — the JSON tab edits exactly this. */
type Payload = Record<string, unknown>

/**
 * Updates are a full replace, so everything LiveKit stores on the trunk is
 * carried through from `base` (the trunk being edited, or the last JSON-tab
 * state) — the form only overwrites the fields it owns. Server-assigned
 * fields are dropped; the id travels in the URL.
 */
function buildPayload(
  direction: Direction,
  values: FormValues,
  base: Payload,
): Payload {
  const rest: Payload = { ...base }
  delete rest.sipTrunkId
  delete rest.createdAt
  delete rest.updatedAt

  const owned = {
    name: values.name,
    numbers: toList(values.numbers),
    authUsername: values.authUsername,
    // A blank password keeps the stored one.
    authPassword: values.authPassword || String(rest.authPassword ?? ""),
  }
  return direction === "inbound"
    ? {
        metadata: "",
        ...rest,
        ...owned,
        allowedAddresses: toList(values.allowedAddresses),
        allowedNumbers: toList(values.allowedNumbers),
      }
    : {
        metadata: "",
        ...rest,
        ...owned,
        address: values.address,
        transport: values.transport,
      }
}

const arr = (value: unknown) =>
  Array.isArray(value) ? (value as Array<string>) : []

function payloadToForm(payload: Payload): FormValues {
  return {
    ...empty,
    name: String(payload.name ?? ""),
    numbers: toRows(arr(payload.numbers)),
    allowedAddresses: toRows(arr(payload.allowedAddresses)),
    allowedNumbers: toRows(arr(payload.allowedNumbers)),
    address: String(payload.address ?? ""),
    transport: String(payload.transport ?? "SIP_TRANSPORT_AUTO"),
    authUsername: String(payload.authUsername ?? ""),
    authPassword: String(payload.authPassword ?? ""),
  }
}

export function TrunkFormSheet({
  direction,
  trunk,
  open,
  onOpenChange,
}: {
  direction: Direction
  trunk?: InboundTrunk | OutboundTrunk
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const editing = Boolean(trunk)
  const [mode, setMode] = useState<"form" | "json">("form")
  const [json, setJson] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [base, setBase] = useState<Payload>({})
  const { run, pending } = useAction()
  const { register, control, handleSubmit, reset, setValue, watch, getValues } =
    useForm<FormValues>({ defaultValues: empty })

  const numbers = useFieldArray({ control, name: "numbers" })
  const allowedAddresses = useFieldArray({ control, name: "allowedAddresses" })
  const allowedNumbers = useFieldArray({ control, name: "allowedNumbers" })

  useEffect(() => {
    if (!open) return
    setMode("form")
    setJsonError(null)
    setBase(trunk ? ({ ...trunk } as unknown as Payload) : {})
    if (!trunk) {
      reset(empty)
      return
    }
    reset({
      ...empty,
      name: trunk.name,
      numbers: toRows(trunk.numbers),
      authUsername: trunk.authUsername,
      authPassword: "",
      ...("address" in trunk
        ? { address: trunk.address, transport: trunk.transport }
        : {
            allowedAddresses: toRows(trunk.allowedAddresses),
            allowedNumbers: toRows(trunk.allowedNumbers),
          }),
    })
  }, [open, trunk, reset])

  const switchMode = (next: string) => {
    if (next === mode) return
    if (next === "json") {
      setJson(JSON.stringify(buildPayload(direction, getValues(), base), null, 2))
      setJsonError(null)
      setMode("json")
      return
    }
    try {
      const parsed = JSON.parse(json) as Payload
      // The parsed JSON becomes the new base, so fields the form has no
      // inputs for survive the round-trip back to Form mode.
      setBase(parsed)
      reset(payloadToForm(parsed))
      setJsonError(null)
      setMode("form")
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }

  const submit = async (payload: Payload) => {
    const ok = await run(
      () =>
        trunk
          ? api.put(`/api/trunks/${direction}/${trunk.sipTrunkId}`, payload)
          : api.post(`/api/trunks/${direction}`, { trunk: payload }),
      {
        success: editing ? "Trunk updated" : "Trunk created",
        failure: editing
          ? "Couldn't update the trunk"
          : "Couldn't create the trunk",
      },
    )

    if (ok) onOpenChange(false)
  }

  const onSubmit = handleSubmit((values) => {
    if (mode === "json") {
      try {
        submit(JSON.parse(json) as Payload)
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : "Invalid JSON")
      }
      return
    }
    submit(buildPayload(direction, values, base))
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={`flex flex-col data-[side=right]:w-full ${
          mode === "json"
            ? "data-[side=right]:sm:max-w-[max(32rem,40vw)]"
            : "data-[side=right]:sm:max-w-lg"
        }`}
      >
        <SheetHeader>
          <SheetTitle>
            {editing ? "Edit" : "New"} {direction} trunk
          </SheetTitle>
          <SheetDescription>
            {direction === "inbound"
              ? "Accepts calls your carrier delivers to this server."
              : "Used when this server places calls out through a carrier."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
          id="trunk-form"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4">
            <Tabs value={mode} onValueChange={switchMode}>
              <TabsList>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "json" ? (
              <JsonEditor
                value={json}
                onChange={setJson}
                error={jsonError}
                hint="The exact trunk object sent to LiveKit. Switching back to Form applies your edits."
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Primary carrier"
                    {...register("name", { required: true })}
                  />
                </div>

                <ListField
                  label="Phone numbers"
                  hint={
                    direction === "inbound"
                      ? "Numbers this trunk answers on. Leave empty to match any."
                      : "Caller IDs available on this trunk."
                  }
                  placeholder="+15550100"
                  name="numbers"
                  fieldArray={numbers}
                  register={register}
                />

                {direction === "outbound" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address">SIP address</Label>
                      <Input
                        id="address"
                        placeholder="sip.carrier.example"
                        {...register("address", { required: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Transport</Label>
                      <Select
                        value={watch("transport")}
                        onValueChange={(v) => setValue("transport", v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSPORTS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <ListField
                      label="Allowed addresses"
                      hint="Carrier IPs or CIDRs allowed to send calls. Empty means any source can reach this trunk."
                      placeholder="203.0.113.0/24"
                      name="allowedAddresses"
                      fieldArray={allowedAddresses}
                      register={register}
                    />

                    <ListField
                      label="Allowed numbers"
                      hint="Restrict which callers may reach this trunk. Empty allows all."
                      placeholder="+15550123"
                      name="allowedNumbers"
                      fieldArray={allowedNumbers}
                      register={register}
                    />
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="authUsername">Auth username</Label>
                    <Input
                      id="authUsername"
                      autoComplete="off"
                      {...register("authUsername")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authPassword">Auth password</Label>
                    <Input
                      id="authPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder={editing ? "Unchanged" : ""}
                      {...register("authPassword")}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <SheetFooter>
            <Button type="submit" form="trunk-form" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Save changes" : "Create trunk"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
