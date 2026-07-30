import { useSyncExternalStore } from "react"

export const REFRESH_STORAGE_KEY = "livekit-ui-refresh"

/** Seconds between reloads of live views. */
export const REFRESH_OPTIONS = [5, 10, 30, 60] as const

export interface RefreshPreference {
  enabled: boolean
  seconds: number
}

/** Frozen so the server snapshot keeps a stable identity across renders. */
const FALLBACK: RefreshPreference = Object.freeze({ enabled: true, seconds: 10 })

let value: RefreshPreference = FALLBACK
let loaded = false
const listeners = new Set<() => void>()

function parse(raw: string | null): RefreshPreference | undefined {
  if (raw === null) return undefined

  // The key used to hold a bare number, where 0 meant off.
  const legacy = Number(raw)
  if (raw.trim() !== "" && !Number.isNaN(legacy)) {
    return legacy === 0
      ? { enabled: false, seconds: FALLBACK.seconds }
      : { enabled: true, seconds: legacy }
  }

  try {
    const stored = JSON.parse(raw) as Partial<RefreshPreference>
    return {
      enabled: stored.enabled ?? FALLBACK.enabled,
      seconds: stored.seconds ?? FALLBACK.seconds,
    }
  } catch {
    return undefined
  }
}

/** Deferred to subscribe time so hydration matches what the server rendered. */
function load() {
  if (loaded) return
  loaded = true
  value = parse(localStorage.getItem(REFRESH_STORAGE_KEY)) ?? FALLBACK
}

function notify() {
  listeners.forEach((listener) => listener())
}

function subscribe(onChange: () => void) {
  load()
  listeners.add(onChange)

  const onStorage = (event: StorageEvent) => {
    if (event.key !== REFRESH_STORAGE_KEY) return
    value = parse(event.newValue) ?? FALLBACK
    notify()
  }

  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", onStorage)
  }
}

function update(next: Partial<RefreshPreference>) {
  value = { ...value, ...next }
  localStorage.setItem(REFRESH_STORAGE_KEY, JSON.stringify(value))
  notify()
}

export function useRefreshPreference() {
  const preference = useSyncExternalStore(
    subscribe,
    () => value,
    () => FALLBACK,
  )

  return {
    ...preference,
    setEnabled: (enabled: boolean) => update({ enabled }),
    setSeconds: (seconds: number) => update({ seconds }),
  }
}

export function refreshLabel(seconds: number): string {
  return `Every ${seconds}s`
}
