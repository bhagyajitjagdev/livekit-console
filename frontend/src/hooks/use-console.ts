import { useQuery } from "@tanstack/react-query"
import { meQuery } from "@/lib/queries"

/** Session flags for the UI. readOnly joins when the backend grows READ_ONLY. */
export function useConsole() {
  const { data } = useQuery(meQuery)
  return {
    user: data?.user ?? null,
    readOnly: false,
  }
}
