import { cn } from "@/lib/utils"

/** Tile with the bars knocked out, so the mark inherits any text colour. */
const TILE =
  "M6 0h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z"
const BARS =
  "M6 11.25a1.25 1.25 0 0 1 2.5 0v1.5a1.25 1.25 0 0 1-2.5 0z" +
  "M10.75 7.25a1.25 1.25 0 0 1 2.5 0v9.5a1.25 1.25 0 0 1-2.5 0z" +
  "M15.5 9.75a1.25 1.25 0 0 1 2.5 0v4.5a1.25 1.25 0 0 1-2.5 0z"

const BAR_RECTS = [
  { x: 6, y: 10, height: 4 },
  { x: 10.75, y: 6, height: 12 },
  { x: 15.5, y: 8.5, height: 7 },
]

/** Only the loading overlay renders the animated form, so one id is enough. */
const MASK_ID = "brand-mark-bars"

/**
 * A filled tile rather than an outline glyph, so it never reads as one of the
 * stroked nav icons sitting directly below it. The animated form drives the
 * bars from a mask, which the flat path cannot express.
 */
export function BrandMark({
  className,
  animated = false,
}: {
  className?: string
  animated?: boolean
}) {
  if (!animated) {
    return (
      <svg
        viewBox="0 0 24 24"
        role="img"
        aria-label="Console"
        className={cn("size-6", className)}
      >
        <path d={TILE + BARS} fill="currentColor" fillRule="evenodd" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
      className={cn("size-6", className)}
    >
      <mask id={MASK_ID}>
        <rect width="24" height="24" rx="6" fill="white" />
        <g fill="black">
          {BAR_RECTS.map((bar) => (
            <rect
              key={bar.x}
              className="brand-bar"
              x={bar.x}
              y={bar.y}
              width="2.5"
              height={bar.height}
              rx="1.25"
            />
          ))}
        </g>
      </mask>
      <rect
        width="24"
        height="24"
        rx="6"
        fill="currentColor"
        mask={`url(#${MASK_ID})`}
      />
    </svg>
  )
}
