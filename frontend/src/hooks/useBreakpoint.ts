import * as React from "react"

export const TABLET_BREAKPOINT = 768
export const DESKTOP_BREAKPOINT = 1024

export type Breakpoint = "mobile" | "tablet" | "desktop"

function getBreakpoint(width: number): Breakpoint {
  if (width < TABLET_BREAKPOINT) return "mobile"
  if (width < DESKTOP_BREAKPOINT) return "tablet"
  return "desktop"
}

function subscribe(callback: () => void) {
  const tabletQuery = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
  const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  tabletQuery.addEventListener("change", callback)
  desktopQuery.addEventListener("change", callback)
  return () => {
    tabletQuery.removeEventListener("change", callback)
    desktopQuery.removeEventListener("change", callback)
  }
}

function getSnapshot(): Breakpoint {
  return getBreakpoint(window.innerWidth)
}

function getServerSnapshot(): Breakpoint {
  return "desktop"
}

export function useBreakpoint(): Breakpoint {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
