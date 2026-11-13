import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BOTTOM_NAV, isBottomNavActive, type NavItem } from '@/components/layout/nav-config'
import {
  getInventorySummary,
  getShoppingOverview,
  getTodaysTasks,
  getUpcomingSubscriptions,
} from '@/lib/calc'
import { transitions } from '@/lib/motion'
import { prefetchRoute } from '@/lib/routes'
import { useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'

function useBadgeCounts() {
  const data = useAppData()
  return {
    tasks: getTodaysTasks(data.tasks).length,
    shopping: getShoppingOverview(data.shoppingLists).activeCount,
    inventory: getInventorySummary(data.inventory).alertCount,
    internet: getUpcomingSubscriptions(data.subscriptions, 7).length,
  }
}

function getCount(item: NavItem, counts: ReturnType<typeof useBadgeCounts>): number {
  if (!item.badge) return 0
  return counts[item.badge] ?? 0
}

export function BottomNav() {
  const location = useLocation()
  const counts = useBadgeCounts()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex h-[64px] max-w-md items-center justify-around rounded-[22px] border border-line/80 bg-[var(--nav-glass)] px-1.5 shadow-[0_20px_50px_-18px_rgba(8,42,64,0.35)] backdrop-blur-2xl">
        {BOTTOM_NAV.map((item) => {
          const active = isBottomNavActive(location.pathname, item)
          const Icon = item.icon
          const count = getCount(item, counts)
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => prefetchRoute(item.to)}
              onFocus={() => prefetchRoute(item.to)}
              onPointerDown={() => prefetchRoute(item.to)}
              className="focus-ring relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl"
            >
              <motion.span
                className="relative flex h-8 w-12 items-center justify-center rounded-[12px]"
                whileTap={{ scale: 0.9 }}
                transition={transitions.springSnappy}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-[12px] bg-brand/12"
                    transition={transitions.spring}
                    aria-hidden="true"
                  />
                ) : null}
                <Icon
                  size={19}
                  strokeWidth={active ? 2.35 : 1.9}
                  className={cn(
                    'relative z-10 transition-colors duration-150',
                    active ? 'text-brand' : 'text-ink-3',
                  )}
                  aria-hidden="true"
                />
                {count > 0 ? (
                  <span
                    className={cn(
                      'absolute right-2 top-0.5 z-20 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border-2 border-[var(--nav-glass)] px-0.5 text-[0.5rem] font-extrabold leading-none',
                      active ? 'bg-brand text-white' : 'bg-ink-3/20 text-ink-2',
                    )}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                ) : null}
              </motion.span>
              <span
                className={cn(
                  'max-w-full truncate text-[0.5625rem] font-bold tracking-[0.01em] transition-colors duration-150',
                  active ? 'text-ink' : 'text-ink-3',
                )}
              >
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
