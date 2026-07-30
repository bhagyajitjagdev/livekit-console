import { useRefreshPreference } from "@/lib/preferences"

/**
 * The auto-refresh preference as a TanStack Query `refetchInterval` — the
 * header toggle and Settings both drive the same stored value.
 */
export function useRefetchInterval(): number | false {
  const { enabled, seconds } = useRefreshPreference()
  return enabled ? seconds * 1000 : false
}
