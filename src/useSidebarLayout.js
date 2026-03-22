import { useState, useEffect, useCallback } from 'react'

/** Tailwind `lg` breakpoint — sidebar docked on desktop, drawer on smaller viewports */
const LG_MIN_PX = 1024

/**
 * Responsive drawer sidebar: closed off-canvas on mobile until opened; always visible on lg+.
 * Fixes transform not updating when sidebarOpen toggles (ref-only pattern was stale).
 */
export function useSidebarLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= LG_MIN_PX
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_MIN_PX}px)`)
    const sync = () => {
      const desktop = mq.matches
      setIsDesktop(desktop)
      if (desktop) setSidebarOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  /** translateX: hidden off-screen on mobile when closed */
  const sidebarTransform = isDesktop
    ? 'translateX(0)'
    : sidebarOpen
      ? 'translateX(0)'
      : 'translateX(-100%)'

  useEffect(() => {
    if (!isDesktop && sidebarOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isDesktop, sidebarOpen])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  return {
    sidebarOpen,
    setSidebarOpen,
    isDesktop,
    openSidebar,
    closeSidebar,
    sidebarTransform,
  }
}
