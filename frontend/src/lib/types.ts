/**
 * Shapes exactly as LiveKit's protobuf JSON serialisation delivers them
 * through the backend: camelCase keys, int64 values as strings, enums by
 * name ("SIP", "EGRESS_ACTIVE", "SIP_TRANSPORT_TLS"). Only the fields the
 * UI reads are declared — the backend passes LiveKit's payloads through
 * untouched, so extra fields are present and safe to ignore.
 */

export interface TrackInfo {
  sid: string
  name: string
  /** "MICROPHONE" | "CAMERA" | "SCREEN_SHARE" | ... */
  source: string
  muted: boolean
  mimeType: string
}

export interface Participant {
  sid: string
  identity: string
  name: string
  /** "STANDARD" | "SIP" | "AGENT" | "EGRESS" | "INGRESS" | ... */
  kind: string
  /** "JOINING" | "JOINED" | "ACTIVE" | "DISCONNECTED" */
  state: string
  /** Seconds since epoch. Newer servers also send joinedAtMs. */
  joinedAt: string
  joinedAtMs?: string
  tracks: Array<TrackInfo>
  /** SIP participants carry call metadata as attributes. */
  attributes: Record<string, string>
}

export interface Room {
  sid: string
  name: string
  numParticipants: number
  maxParticipants: number
  /** Seconds since epoch. Newer servers also send creationTimeMs. */
  creationTime: string
  creationTimeMs?: string
  activeRecording: boolean
  metadata: string
}

export interface RoomWithParticipants extends Room {
  participants: Array<Participant>
}

export interface InboundTrunk {
  sipTrunkId: string
  name: string
  numbers: Array<string>
  allowedAddresses: Array<string>
  allowedNumbers: Array<string>
  authUsername: string
  authPassword: string
  metadata: string
  /** RFC 3339 — absent on records older than the field. */
  createdAt?: string
  updatedAt?: string
}

export interface OutboundTrunk {
  sipTrunkId: string
  name: string
  numbers: Array<string>
  address: string
  /** "SIP_TRANSPORT_AUTO" | "SIP_TRANSPORT_UDP" | "SIP_TRANSPORT_TCP" | "SIP_TRANSPORT_TLS" */
  transport: string
  authUsername: string
  authPassword: string
  metadata: string
  /** RFC 3339 — absent on records older than the field. */
  createdAt?: string
  updatedAt?: string
}

export type Trunk = InboundTrunk | OutboundTrunk

export interface TrunksResponse {
  inbound: Array<InboundTrunk>
  outbound: Array<OutboundTrunk>
}

/** Entries carry much more than the name — all preserved through edits. */
export interface AgentDispatch {
  agentName: string
  metadata?: string
  restartPolicy?: string
  deployment?: string
  attributes?: Record<string, string>
}

/** The rule oneof — exactly one branch is present. */
export interface DispatchRuleSpec {
  dispatchRuleDirect?: { roomName: string; pin: string }
  dispatchRuleIndividual?: {
    roomPrefix: string
    pin: string
    noRandomness?: boolean
  }
  dispatchRuleCallee?: { roomPrefix: string; pin: string; randomize: boolean }
}

export interface DispatchRule {
  sipDispatchRuleId: string
  name: string
  trunkIds: Array<string>
  rule?: DispatchRuleSpec
  roomConfig?: { agents?: Array<AgentDispatch> }
  metadata: string
  /** Restrict the rule to these dialled numbers. Empty matches all. */
  inboundNumbers: Array<string>
  /** Deprecated spelling of inboundNumbers — older records may use it. */
  numbers: Array<string>
  hidePhoneNumber: boolean
  attributes: Record<string, string>
  roomPreset: string
  /** RFC 3339 — absent on records older than the field. */
  createdAt?: string
  updatedAt?: string
}

export interface EncodedFileOutput {
  filepath: string
  s3?: { bucket: string; region: string }
  gcp?: { bucket: string }
  azure?: { containerName: string }
  aliOSS?: { bucket: string; region: string }
}

export interface EgressFileResult {
  filename: string
  location: string
  /** Bytes. */
  size: string
  /** Nanoseconds. */
  duration: string
}

/** The request oneof branches that can carry file outputs. */
export interface EncodedEgressRequest {
  audioOnly?: boolean
  fileOutputs?: Array<EncodedFileOutput>
}

export interface Egress {
  egressId: string
  roomId: string
  roomName: string
  /** "EGRESS_STARTING" | "EGRESS_ACTIVE" | "EGRESS_COMPLETE" | "EGRESS_FAILED" | ... */
  status: string
  /** Nanoseconds since epoch; "0" when not started/ended. */
  startedAt: string
  endedAt: string
  error: string
  fileResults: Array<EgressFileResult>
  /** Legacy single-result oneof — older servers set this instead of fileResults. */
  file?: EgressFileResult
  roomComposite?: EncodedEgressRequest
  web?: EncodedEgressRequest
  participant?: EncodedEgressRequest
  trackComposite?: EncodedEgressRequest
}

export interface EgressResponse {
  live: Array<Egress>
  past: Array<Egress>
}

export interface EnvironmentCounts {
  rooms: number
  participants: number
  inboundTrunks: number
  outboundTrunks: number
  dispatchRules: number
  activeEgress: number
}

export interface Overview {
  counts: EnvironmentCounts
  rooms: Array<RoomWithParticipants>
}

export interface ConfigStatus {
  url: boolean
  apiKey: boolean
  apiSecret: boolean
}

export interface Connection {
  url: string
  /** Masked — the secret never leaves the backend. */
  apiKey: string
  config: ConfigStatus
  configured: boolean
}

export interface Me {
  user: string | null
}
