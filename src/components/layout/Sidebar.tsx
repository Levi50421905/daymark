import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { LogoMark, Wordmark } from '@/components/layout/Logo'
import { DESKTOP_NAV, isDesktopNavActive, type NavItem } from '@/components/layout/nav-config'
import { StatusDot } from '@/components/ui/Badge'
import { getInventorySummary, getShoppingOverview, getTodaysTasks, getUpcomingSubscriptions } from '@/lib/calc'
import { relativeTimeLabel } from '@/lib/dates'
import { transitions } from '@/lib/motion'
import { useAppData, useAppStore } from '@/lib/store'
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

function badgeFor(item: NavItem, counts: ReturnType<typeof useBadgeCounts>): number {
  if (!item.badge) return 0
  return counts[item.badge] ?? 0
}

export function Sidebar() {
  const location = useLocation()
  const data = useAppData()
  const { saveStatus, lastSavedAt } = useAppStore()
  const counts = useBadgeCounts()
  const displayName = data.settings.userName.trim() || 'Sahabat'
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-line/80 bg-surface/72 backdrop-blur-2xl lg:flex">
      <div className="flex h-[76px] shrink-0 items-center px-5">
        <Link to="/" className="focus-ring flex items-center gap-2.5 rounded-xl">
          <LogoMark size={38} />
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2" aria-label="Navigasi utama">
        <p className="mb-2 px-3 text-[0.5625rem] font-bold uppercase tracking-[0.2em] text-ink-3">
          Workspace
        </p>
        <ul className="space-y-1">
          {DESKTOP_NAV.map((item) => {
            const active = isDesktopNavActive(location.pathname, item)
            const Icon = item.icon
            const count = badgeFor(item, counts)
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'focus-ring group relative flex h-[46px] items-center gap-3 rounded-[14px] px-3 text-[0.8125rem] font-semibold transition-colors duration-150',
                    active ? 'text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="desktop-sidebar-active"
                      className="absolute inset-0 rounded-[14px] border border-line bg-gradient-to-r from-brand/12 via-sky/8 to-transparent"
                      transition={transitions.spring}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cn(
                      'relative z-10 flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors',
                      active ? 'bg-surface text-brand shadow-sm' : 'text-ink-3 group-hover:text-ink-2',
                    )}
                  >
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
                  </span>
                  <span className="relative z-10 flex-1">{item.label}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        'relative z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.5625rem] font-bold',
                        active ? 'bg-brand text-white' : 'bg-brand/10 text-brand',
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null}
                  {active ? (
                    <motion.span
                      layoutId="desktop-sidebar-dot"
                      className="relative z-10 h-1.5 w-1.5 rounded-full bg-brand"
                      transition={transitions.spring}
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="my-5 border-t border-line" />

        <Link
          to="/settings"
          className="focus-ring group flex items-center gap-3 rounded-[14px] p-2.5 transition-colors hover:bg-surface-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender/15 text-xs font-extrabold text-lavender">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-ink">{displayName}</span>
            <span className="block text-[0.625rem] font-medium text-ink-3">Ruang pribadi</span>
          </span>
          <ArrowUpRight size={14} className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </nav>

      <div className="shrink-0 px-3 pb-4">
        <Link
          to="/settings#data"
          className="focus-ring block overflow-hidden rounded-[18px] border border-line bg-gradient-to-br from-surface-2 via-surface to-brand/[0.04] p-3.5 transition-colors hover:border-line-strong"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand/10 text-brand">
              <ShieldCheck size={16} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.6875rem] font-bold text-ink">Local-first</p>
              <p className="text-[0.625rem] font-medium text-ink-3">Data tinggal di perangkatmu</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line/80 pt-2.5">
            <span className="flex items-center gap-1.5 text-[0.625rem] font-semibold text-ink-3">
              <StatusDot
                tone={saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'warning' : 'success'}
                pulse={saveStatus === 'saving'}
              />
              {saveStatus === 'saving'
                ? 'Menyimpan…'
                : saveStatus === 'error'
                  ? 'Belum tersimpan'
                  : lastSavedAt
                    ? `Tersimpan ${relativeTimeLabel(lastSavedAt).toLowerCase()}`
                    : 'Tersimpan'}
            </span>
            {data.meta.demoData ? (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[0.5625rem] font-bold text-warning">
                Data contoh
              </span>
            ) : (
              <span className="text-[0.5625rem] font-semibold text-ink-3">v1.0</span>
            )}
          </div>
        </Link>
      </div>
    </aside>
  )
}
