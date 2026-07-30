import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { Loader2, Plus, X } from "lucide-react"
import type { DispatchRule, InboundTrunk } from "@/lib/types"
import type { RuleKind } from "@/lib/livekit"
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
import { Textarea } from "@/components/ui/textarea"
import { JsonEditor } from "@/components/form/json-editor"
import { MultiSelect } from "@/components/form/multi-select"
import { Switch } from "@/components/ui/switch"
import { buildRuleSpec, flattenRule } from "@/lib/livekit"
import { useAction } from "@/hooks/use-action"
import { api } from "@/lib/api"

type FormValues = {
  name: string
  kind: RuleKind
  roomPrefix: string
  roomName: string
  randomize: boolean
  pin: string
  agents: Array<{ name: string; metadata: string }>
  trunkIds: Array<string>
  metadata: string
}

const empty: FormValues = {
  name: "",
  kind: "individual",
  roomPrefix: "call-",
  roomName: "",
  randomize: false,
  pin: "",
  agents: [{ name: "", metadata: "" }],
  trunkIds: [],
  metadata: "",
}

const kindHint: Record<RuleKind, string> = {
  individual: "Every caller gets their own room, named with the prefix below.",
  direct: "All matching callers join one shared room.",
  callee: "One room per dialled number, named with the prefix below.",
}

/** individual and callee both name the room from a prefix; only direct is fixed. */
const usesPrefix = (kind: RuleKind) => kind !== "direct"

/** The SIPDispatchRuleInfo JSON sent to LiveKit — the JSON tab edits this. */
type Payload = Record<string, unknown>

/**
 * Updates are a full replace, so everything LiveKit stores on the rule is
 * carried through from `base` (the rule being edited, or the last JSON-tab
 * state) — the form only overwrites the fields it owns. Server-assigned
 * fields are dropped; the id travels in the URL.
 */
function buildPayload(values: FormValues, base: Payload): Payload {
  const rest: Payload = { ...base }
  delete rest.sipDispatchRuleId
  delete rest.createdAt
  delete rest.updatedAt
  const roomConfig = (rest.roomConfig as Payload | undefined) ?? {}
  const baseAgents = (roomConfig.agents as Array<Payload> | undefined) ?? []
  const baseRule = (rest.rule as Payload | undefined) ?? {}

  // Rebuild the oneof branch, but keep whatever extra fields that branch
  // already carried (e.g. noRandomness) when the kind stays the same.
  const spec = buildRuleSpec({
    kind: values.kind,
    roomPrefix: values.roomPrefix,
    roomName: values.roomName,
    randomize: values.randomize,
    pin: values.pin,
  }) as unknown as Payload
  const branch = Object.keys(spec)[0]
  const rule = {
    [branch]: {
      ...((baseRule[branch] as Payload | undefined) ?? {}),
      ...(spec[branch] as Payload),
    },
  }

  const agentEntries = values.agents
    .map((a) => ({ name: a.name.trim(), metadata: a.metadata }))
    .filter((a) => a.name)

  return {
    inboundNumbers: [],
    hidePhoneNumber: false,
    attributes: {},
    roomPreset: "",
    ...rest,
    name: values.name,
    trunkIds: values.trunkIds,
    metadata: values.metadata,
    rule,
    roomConfig: {
      ...roomConfig,
      // Agent entries carry more than name+metadata (restart policy, …) —
      // matched back by name, then by position, so edits never strip them.
      agents: agentEntries.map((entry, index) => ({
        ...(baseAgents.find((a) => a.agentName === entry.name) ??
          baseAgents[index] ??
          {}),
        agentName: entry.name,
        metadata: entry.metadata,
      })),
    },
  }
}

function payloadToForm(payload: Payload): FormValues {
  const flat = flattenRule(payload as unknown as DispatchRule)
  const agents = (
    (
      payload.roomConfig as
        | { agents?: Array<{ agentName?: string; metadata?: string }> }
        | undefined
    )?.agents ?? []
  ).map((a) => ({ name: a.agentName ?? "", metadata: a.metadata ?? "" }))

  return {
    name: String(payload.name ?? ""),
    kind: flat.kind,
    roomPrefix: flat.roomPrefix,
    roomName: flat.roomName,
    randomize: flat.randomize,
    pin: flat.pin,
    agents: agents.length ? agents : [{ name: "", metadata: "" }],
    trunkIds: Array.isArray(payload.trunkIds)
      ? (payload.trunkIds as Array<string>)
      : [],
    metadata: String(payload.metadata ?? ""),
  }
}

export function DispatchRuleFormSheet({
  rule,
  trunks,
  open,
  onOpenChange,
}: {
  rule?: DispatchRule
  trunks: Array<InboundTrunk>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const editing = Boolean(rule)
  const [mode, setMode] = useState<"form" | "json">("form")
  const [json, setJson] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [base, setBase] = useState<Payload>({})
  const { run, pending } = useAction()
  const { register, control, handleSubmit, reset, setValue, watch, getValues } =
    useForm<FormValues>({ defaultValues: empty })

  const agents = useFieldArray({ control, name: "agents" })
  const kind = watch("kind")
  const randomize = watch("randomize")
  const selectedTrunks = watch("trunkIds")

  useEffect(() => {
    if (!open) return
    setMode("form")
    setJsonError(null)
    setBase(rule ? ({ ...rule } as unknown as Payload) : {})
    if (!rule) {
      reset(empty)
      return
    }
    const flat = flattenRule(rule)
    const ruleAgents = rule.roomConfig?.agents ?? []
    reset({
      name: rule.name,
      kind: flat.kind,
      roomPrefix: flat.roomPrefix,
      roomName: flat.roomName,
      randomize: flat.randomize,
      pin: flat.pin,
      agents: ruleAgents.length
        ? ruleAgents.map((a) => ({
            name: a.agentName,
            metadata: a.metadata ?? "",
          }))
        : [{ name: "", metadata: "" }],
      trunkIds: rule.trunkIds,
      metadata: rule.metadata,
    })
  }, [open, rule, reset])

  const switchMode = (next: string) => {
    if (next === mode) return
    if (next === "json") {
      setJson(JSON.stringify(buildPayload(getValues(), base), null, 2))
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
        rule
          ? api.put(`/api/dispatch-rules/${rule.sipDispatchRuleId}`, payload)
          : api.post("/api/dispatch-rules", { dispatchRule: payload }),
      {
        success: editing ? "Rule updated" : "Rule created",
        failure: editing
          ? "Couldn't update the rule"
          : "Couldn't create the rule",
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
    submit(buildPayload(values, base))
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
          <SheetTitle>{editing ? "Edit" : "New"} dispatch rule</SheetTitle>
          <SheetDescription>
            Decides which room an inbound call joins, and which agent answers
            it.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
          id="dispatch-rule-form"
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
                hint="The exact rule object sent to LiveKit. Switching back to Form applies your edits."
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="Support line"
                    {...register("name", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rule type</Label>
                  <Select
                    value={kind}
                    onValueChange={(v) => setValue("kind", v as RuleKind)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="callee">Callee</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {kindHint[kind]}
                  </p>
                </div>

                {usesPrefix(kind) ? (
                  <div className="space-y-2">
                    <Label htmlFor="roomPrefix">Room prefix</Label>
                    <p className="text-xs text-muted-foreground">
                      {kind === "callee"
                        ? "The dialled number is appended to this prefix."
                        : "The caller's number is appended to this prefix."}
                    </p>
                    <Input
                      id="roomPrefix"
                      placeholder="call-"
                      {...register("roomPrefix")}
                    />
                  </div>
                ) : null}

                {kind === "callee" ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="randomize">Randomize room name</Label>
                      <p className="text-xs text-muted-foreground">
                        Append a random suffix so repeat calls to the same
                        number never share a room.
                      </p>
                    </div>
                    <Switch
                      id="randomize"
                      checked={randomize}
                      onCheckedChange={(value) => setValue("randomize", value)}
                    />
                  </div>
                ) : null}

                {kind === "direct" ? (
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room name</Label>
                    <Input
                      id="roomName"
                      placeholder="support-queue"
                      {...register("roomName", { required: true })}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Trunks</Label>
                  <p className="text-xs text-muted-foreground">
                    Which inbound trunks this rule applies to. Select none to
                    apply to all.
                  </p>
                  <MultiSelect
                    options={trunks.map((t) => ({
                      value: t.sipTrunkId,
                      label: t.name,
                      hint: t.numbers[0] ?? "Any number",
                    }))}
                    selected={selectedTrunks}
                    onChange={(ids) => setValue("trunkIds", ids)}
                    placeholder="All inbound trunks"
                    searchPlaceholder="Search trunks..."
                    emptyLabel="No trunks found."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Agents</Label>
                  <p className="text-xs text-muted-foreground">
                    Agents dispatched into the room when a call arrives. The
                    metadata string is handed to the agent as-is.
                  </p>
                  <div className="space-y-2">
                    {agents.fields.map((field, i) => (
                      <div
                        key={field.id}
                        className="space-y-2 rounded-md border p-3"
                      >
                        <div className="flex gap-2">
                          <Input
                            placeholder="inbound-agent"
                            {...register(`agents.${i}.name`)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => agents.remove(i)}
                            disabled={agents.fields.length === 1}
                          >
                            <X />
                            <span className="sr-only">Remove agent</span>
                          </Button>
                        </div>
                        <Textarea
                          placeholder={'Agent metadata — e.g. {"campaign_id": "…"}'}
                          spellCheck={false}
                          className="min-h-16 font-mono text-xs leading-relaxed"
                          {...register(`agents.${i}.metadata`)}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => agents.append({ name: "", metadata: "" })}
                  >
                    <Plus />
                    Add agent
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <p className="text-xs text-muted-foreground">
                    Callers must enter this before joining. Leave empty for
                    none.
                  </p>
                  <Input id="pin" inputMode="numeric" {...register("pin")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-metadata">Metadata</Label>
                  <p className="text-xs text-muted-foreground">
                    Free-form data stored on the rule itself, separate from
                    each agent's metadata above.
                  </p>
                  <Textarea
                    id="rule-metadata"
                    spellCheck={false}
                    className="min-h-16 font-mono text-xs leading-relaxed"
                    {...register("metadata")}
                  />
                </div>
              </>
            )}
          </div>

          <SheetFooter>
            <Button type="submit" form="dispatch-rule-form" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Save changes" : "Create rule"}
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
