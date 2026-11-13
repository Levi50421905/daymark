import { Suspense, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { pageTitleForPath } from '@/components/layout/nav-config'
import { usePageTitle } from '@/lib/hooks/usePageTitle'
import { prefetchPrimaryRoutes } from '@/lib/routes'
import { saveNow } from '@/lib/store'

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  usePageTitle(pageTitleForPath(location.pathname))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    const timer = window.setTimeout(prefetchPrimaryRoutes, 2400)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === 'hidden') void saveNow()
    }
    const handlePageHide = () => void saveNow()
    document.addEventListener('visibilitychange', handleHide)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      document.removeEventListener('visibilitychange', handleHide)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh">
        <Sidebar />
        <div className="lg:pl-[252px]">
          <Topbar />
          <main className="app-shell-main">
            {/*
              A keyed, CSS-driven entrance is deliberately used for route changes
              instead of AnimatePresence exit/wait. Suspense can resolve after the
              old route is gone, and the content must never be held at opacity 0.
            */}
            <div key={location.pathname} className="page-container page-enter pt-5 sm:pt-6">
              <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </MotionConfig>
  )
}
