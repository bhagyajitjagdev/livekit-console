import { useEffect, useState } from "react"
import {
  formatDateTime,
  formatDuration,
  formatShortDateTime,
  formatTime,
} from "@/lib/format"

/**
 * Anything derived from `Date.now()` or the local timezone differs between the
 * server render and the browser, which React reports as a hydration mismatch —
 * and a mismatch drops the whole tree back to client rendering. Both components
 * below stay empty until mounted so the two renders always agree.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

const formatters = {
  time: formatTime,
  short: formatShortDateTime,
  full: formatDateTime,
}

export function Time({
  at,
  format = "time",
}: {
  at: number
  format?: keyof typeof formatters
}) {
  const mounted = useMounted()
  return <>{mounted ? formatters[format](at) : null}</>
}

/** Ticks, so a running call's duration advances without waiting for a refresh. */
export function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return <>{now === null ? null : formatDuration(now - since)}</>
}
