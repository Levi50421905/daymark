import { Suspense, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { pageTitleForPath } from '@/components/layout/nav-config'
import { usePageTitle } from '@/lib/hooks/usePageTitle'
import { pageTransition } from '@/lib/motion'
import { saveNow } from '@/lib/store'

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  usePageTitle(pageTitleForPath(location.pathname))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="page-container pt-5 sm:pt-6"
              >
                <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <BottomNav />
      </div>
    </MotionConfig>
  )
}
