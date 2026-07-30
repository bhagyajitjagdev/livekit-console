import type { RoomWithParticipants } from "@/lib/types"

export type RoomKind = "phone" | "web" | "empty" | "other"

/**
 * Derived from participant composition, not room naming — a room named
 * anything at all still classifies correctly.
 */
export function roomKind(room: RoomWithParticipants): RoomKind {
  if (room.participants.length === 0) return "empty"

  const kinds = new Set(room.participants.map((p) => p.kind))
  if (kinds.has("SIP")) return "phone"
  if (kinds.has("STANDARD")) return "web"
  return "other"
}

export const roomKindLabel: Record<RoomKind, string> = {
  phone: "Phone",
  web: "Web",
  empty: "Empty",
  other: "Other",
}

/** The remote party, when the room has a SIP leg. */
export function remoteNumber(room: RoomWithParticipants): string | null {
  const sip = room.participants.find((p) => p.kind === "SIP")
  return sip?.attributes["sip.phoneNumber"] ?? sip?.name ?? null
}

export function agentNames(room: RoomWithParticipants): Array<string> {
  return room.participants.filter((p) => p.kind === "AGENT").map((p) => p.name)
}
