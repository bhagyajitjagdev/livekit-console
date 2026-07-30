import { useEffect, useState } from "react"
import { useIsFetching } from "@tanstack/react-query"
import { useRouterState } from "@tanstack/react-router"
import { BrandMark } from "@/components/brand-mark"

/** Below dialogs, above the sidebar and sticky headers. */
const LAYER = "z-40"

/** Fast navigations shouldn't flash an overlay. */
const APPEAR_AFTER_MS = 150

export function NavigationOverlay() {
  const navigating = useRouterState({
    select: (state) =>
      state.isLoading && state.location.href !== state.resolvedLocation?.href,
  })
  // Queries fetching with nothing cached yet — a page's first load. Background
  // refetches have data (status "success") and never trigger the overlay.
  const loadingFresh =
    useIsFetching({ predicate: (query) => query.state.status === "pending" }) > 0
  const busy = navigating || loadingFresh
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!busy) {
      setVisible(false)
      return
    }
    const id = setTimeout(() => setVisible(true), APPEAR_AFTER_MS)
    return () => clearTimeout(id)
  }, [busy])

  if (!visible) return null

  return (
    <div
      data-slot="navigation-overlay"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 ${LAYER} flex items-center justify-center bg-background/50 duration-150 animate-in fade-in-0 pointer-events-none supports-backdrop-filter:backdrop-blur-xs`}
    >
      <div className="flex items-center gap-2.5">
        <BrandMark animated className="size-7 shrink-0" />
        <span className="text-lg font-semibold">LiveKit</span>
        <span className="text-muted-foreground text-lg">Console</span>
      </div>
    </div>
  )
}
