/**
 * Helpers over LiveKit's protobuf JSON: int64-string timestamps, enum names,
 * and the egress/dispatch-rule oneofs the UI has to flatten for display.
 */

import type {
  AgentDispatch,
  DispatchRule,
  DispatchRuleSpec,
  Egress,
  EncodedFileOutput,
  Participant,
  Room,
} from "@/lib/types"

export function secondsToMs(value: string | undefined): number {
  return Number(value ?? 0) * 1000
}

export function nanosToMs(value: string | undefined): number {
  return Number(value ?? 0) / 1e6
}

/** RFC 3339 Timestamp field -> epoch ms; undefined when the server never set it. */
export function timestampMs(value: string | undefined): number | undefined {
  return value ? Date.parse(value) : undefined
}

/** Older servers only populate the second-precision field. */
export function roomCreatedAt(room: Room): number {
  return Number(room.creationTimeMs ?? 0) || secondsToMs(room.creationTime)
}

export function participantJoinedAt(participant: Participant): number {
  return (
    Number(participant.joinedAtMs ?? 0) || secondsToMs(participant.joinedAt)
  )
}

/** "SIP_TRANSPORT_TLS" -> "TLS" */
export function transportLabel(transport: string): string {
  return transport.replace("SIP_TRANSPORT_", "")
}

/** "EGRESS_LIMIT_REACHED" -> "limit reached" */
export function egressStatusLabel(status: string): string {
  return status.replace("EGRESS_", "").replaceAll("_", " ").toLowerCase()
}

export const EGRESS_LIVE = new Set(["EGRESS_STARTING", "EGRESS_ACTIVE"])

export function egressLive(egress: Egress): boolean {
  return EGRESS_LIVE.has(egress.status)
}

/** The request oneof — everything except `track`, which has no file outputs. */
function encodedRequest(egress: Egress) {
  return (
    egress.roomComposite ?? egress.web ?? egress.participant ?? egress.trackComposite
  )
}

/** Only the request that started the egress records whether it was audio-only. */
export function egressAudioOnly(egress: Egress): boolean {
  return Boolean(egress.roomComposite?.audioOnly ?? egress.web?.audioOnly)
}

export type StorageBackend = "s3" | "gcp" | "azure" | "aliOSS" | "local"

export interface EgressFile {
  filename: string
  /** `s3://bucket/key` when the destination is known, else the raw object key. */
  location: string
  backend: StorageBackend
  region?: string
  /** Only present once the server reports a finished upload. */
  size?: number
  /** Milliseconds. */
  duration?: number
}

function destination(output: EncodedFileOutput): {
  backend: StorageBackend
  bucket?: string
  region?: string
} {
  if (output.s3) return { backend: "s3", bucket: output.s3.bucket, region: output.s3.region }
  if (output.gcp) return { backend: "gcp", bucket: output.gcp.bucket }
  if (output.azure) return { backend: "azure", bucket: output.azure.containerName }
  if (output.aliOSS) {
    return { backend: "aliOSS", bucket: output.aliOSS.bucket, region: output.aliOSS.region }
  }
  return { backend: "local" }
}

function basename(path: string): string {
  return path.split("/").pop() || path
}

/**
 * LiveKit Cloud leaves `fileResults` empty even for completed egress, so the
 * destination is reconstructed from the request. Self-hosted does populate
 * the result, which is preferred because it is what actually landed.
 */
export function egressFile(egress: Egress): EgressFile | undefined {
  // Older servers report the result only through the legacy `file` oneof.
  const result = egress.fileResults.at(0) ?? egress.file
  const requested = encodedRequest(egress)?.fileOutputs?.at(0)

  if (!result && !requested) return undefined

  const target = requested ? destination(requested) : { backend: "local" as const }
  const key = result?.filename || requested?.filepath || ""
  const bucket = "bucket" in target ? target.bucket : undefined
  const size = Number(result?.size ?? 0)
  const duration = nanosToMs(result?.duration)

  return {
    filename: basename(key),
    location:
      result?.location || (bucket ? `${target.backend}://${bucket}/${key}` : key),
    backend: target.backend,
    region: "region" in target ? target.region || undefined : undefined,
    size: size > 0 ? size : undefined,
    duration: duration > 0 ? duration : undefined,
  }
}

export type RuleKind = "individual" | "direct" | "callee"

export interface FlatRule {
  kind: RuleKind
  roomPrefix: string
  roomName: string
  randomize: boolean
  pin: string
}

/** Flattens the rule oneof into one shape for rows and forms. */
export function flattenRule(rule: DispatchRule): FlatRule {
  const spec = rule.rule ?? {}
  if (spec.dispatchRuleDirect) {
    return {
      kind: "direct",
      roomPrefix: "",
      roomName: spec.dispatchRuleDirect.roomName,
      randomize: false,
      pin: spec.dispatchRuleDirect.pin,
    }
  }
  if (spec.dispatchRuleCallee) {
    return {
      kind: "callee",
      roomPrefix: spec.dispatchRuleCallee.roomPrefix,
      roomName: "",
      randomize: Boolean(spec.dispatchRuleCallee.randomize),
      pin: spec.dispatchRuleCallee.pin,
    }
  }
  return {
    kind: "individual",
    roomPrefix: spec.dispatchRuleIndividual?.roomPrefix ?? "",
    roomName: "",
    randomize: false,
    pin: spec.dispatchRuleIndividual?.pin ?? "",
  }
}

/** The inverse — form values back into the rule oneof LiveKit expects. */
export function buildRuleSpec(flat: FlatRule): DispatchRuleSpec {
  switch (flat.kind) {
    case "direct":
      return { dispatchRuleDirect: { roomName: flat.roomName, pin: flat.pin } }
    case "callee":
      return {
        dispatchRuleCallee: {
          roomPrefix: flat.roomPrefix,
          randomize: flat.randomize,
          pin: flat.pin,
        },
      }
    default:
      return {
        dispatchRuleIndividual: { roomPrefix: flat.roomPrefix, pin: flat.pin },
      }
  }
}

export function ruleAgents(rule: DispatchRule): Array<AgentDispatch> {
  return rule.roomConfig?.agents ?? []
}
