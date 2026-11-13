import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Settings, Sun, WifiOff } from 'lucide-react'
import { LogoMark, Wordmark } from '@/components/layout/Logo'
import { pageTitleForPath } from '@/components/layout/nav-config'
import { StatusDot } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { relativeTimeLabel } from '@/lib/dates'
import { transitions } from '@/lib/motion'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function SaveIndicator() {
  const { saveStatus, lastSavedAt } = useAppStore()
  const tone = saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'warning' : 'success'
  const label =
    saveStatus === 'saving' ? 'Menyimpan…' : saveStatus === 'error' ? 'Gagal menyimpan' : 'Tersimpan'
  const title = lastSavedAt
    ? `Penyimpanan lokal: ${label}. Terakhir ${relativeTimeLabel(lastSavedAt).toLowerCase()}.`
    : 'Penyimpanan lokal otomatis'
  return (
    <>
      <span
        role="status"
        aria-label={title}
        title={title}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/80 sm:hidden',
          saveStatus === 'error' && 'border-danger/25',
        )}
      >
        <StatusDot tone={tone} pulse={saveStatus === 'saving'} />
      </span>
      <div
        className={cn(
          'hidden h-8 items-center gap-2 rounded-full border border-line bg-surface/80 px-3 text-[0.6875rem] font-semibold text-ink-2 sm:flex',
          saveStatus === 'error' && 'border-danger/25 text-danger',
        )}
        title={title}
      >
        <StatusDot tone={tone} pulse={saveStatus === 'saving'} />
        {label}
      </div>
    </>
  )
}

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <IconButton
      label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      icon={isDark ? Sun : Moon}
      variant="secondary"
      onClick={toggleTheme}
    />
  )
}

function OfflinePill() {
  const online = useOnlineStatus()
  return (
    <AnimatePresence initial={false}>
      {!online ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.9, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: 'auto' }}
          exit={{ opacity: 0, scale: 0.9, width: 0 }}
          transition={transitions.fast}
          className="flex h-8 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-warning/25 bg-warning/10 px-2.5 text-[0.6875rem] font-bold text-warning"
          title="Kamu sedang offline. Fitur utama tetap berjalan."
        >
          <WifiOff size={13} aria-hidden="true" />
          Offline
        </motion.span>
      ) : null}
    </AnimatePresence>
  )
}

export function Topbar() {
  const location = useLocation()
  const title = pageTitleForPath(location.pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/72 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="focus-ring flex items-center gap-2 rounded-lg lg:hidden">
            <LogoMark size={32} />
            <Wordmark compact />
          </Link>
          <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-3">Daymark</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="truncate text-xs font-bold text-ink-2">{title}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <OfflinePill />
          <SaveIndicator />
          <ThemeToggle />
          <Link to="/settings" aria-label="Buka pengaturan" title="Pengaturan">
            <span className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[13px] border border-line bg-surface text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
              <Settings size={18} strokeWidth={2} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
