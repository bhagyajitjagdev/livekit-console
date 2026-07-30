import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  Connection,
  DispatchRule,
  EgressResponse,
  Me,
  Overview,
  RoomWithParticipants,
  TrunksResponse,
} from "@/lib/types"

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => api.get<Me>("/api/auth/me"),
  staleTime: 60_000,
})

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => api.get<Overview>("/api/overview"),
})

export const roomsQuery = queryOptions({
  queryKey: ["rooms"],
  queryFn: () => api.get<Array<RoomWithParticipants>>("/api/rooms"),
})

export const trunksQuery = queryOptions({
  queryKey: ["trunks"],
  queryFn: () => api.get<TrunksResponse>("/api/trunks"),
})

export const dispatchRulesQuery = queryOptions({
  queryKey: ["dispatch-rules"],
  queryFn: () => api.get<Array<DispatchRule>>("/api/dispatch-rules"),
})

export const egressQuery = queryOptions({
  queryKey: ["egress"],
  queryFn: () => api.get<EgressResponse>("/api/egress"),
})

export const connectionQuery = queryOptions({
  queryKey: ["connection"],
  queryFn: () => api.get<Connection>("/api/settings/connection"),
  staleTime: 60_000,
})
