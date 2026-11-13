import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  ListChecks,
  NotebookPen,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
  Wallet,
} from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { FinanceWidget } from '@/features/dashboard/FinanceWidget'
import { SpendingWidget } from '@/features/dashboard/SpendingWidget'
import { BudgetWidget } from '@/features/dashboard/BudgetWidget'
import { RecentWidget } from '@/features/dashboard/RecentWidget'
import { GoalsWidget } from '@/features/dashboard/GoalsWidget'
import { ShoppingWidget } from '@/features/dashboard/ShoppingWidget'
import { InventoryWidget } from '@/features/dashboard/InventoryWidget'
import { TasksWidget } from '@/features/dashboard/TasksWidget'
import { UpcomingWidget } from '@/features/dashboard/UpcomingWidget'
import { ReviewWidget } from '@/features/dashboard/ReviewWidget'
import { WidgetSettings } from '@/features/dashboard/WidgetSettings'
import {
  getBudgetSummary,
  getShoppingOverview,
  getTodaysTasks,
  getUpcomingItems,
} from '@/lib/calc'
import { formatDateLong, greetingForHour, monthKeyOf, todayISO } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { transitions } from '@/lib/motion'
import { actions, useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { WidgetId } from '@/types/domain'

const WIDGET_SPANS: Record<WidgetId, string> = {
  finance: 'lg:col-span-7',
  spending: 'lg:col-span-5',
  budget: 'lg:col-span-4',
  recent: 'lg:col-span-8',
  tasks: 'lg:col-span-6',
  upcoming: 'lg:col-span-6',
  goals: 'lg:col-span-4',
  shopping: 'lg:col-span-4',
  inventory: 'lg:col-span-4',
  review: 'lg:col-span-12',
}

const WIDGETS: Record<WidgetId, () => JSX.Element> = {
  finance: FinanceWidget,
  spending: SpendingWidget,
  budget: BudgetWidget,
  recent: RecentWidget,
  goals: GoalsWidget,
  shopping: ShoppingWidget,
  inventory: InventoryWidget,
  tasks: TasksWidget,
  upcoming: UpcomingWidget,
  review: ReviewWidget,
}

export default function DashboardPage() {
  const data = useAppData()
  const toast = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const now = new Date()
  const greeting = greetingForHour(now.getHours())
  const displayName = data.settings.userName.trim() || 'Sahabat'
  const currency = data.settings.currency
  const today = todayISO()
  const month = monthKeyOf(today)
  const isEmpty =
    data.transactions.length === 0 &&
    data.shoppingLists.length === 0 &&
    data.inventory.length === 0 &&
    data.mealPlans.length === 0 &&
    data.subscriptions.length === 0 &&
    data.dataPackages.length === 0 &&
    data.devices.length === 0 &&
    data.tasks.length === 0 &&
    data.goals.length === 0 &&
    data.reviews.length === 0 &&
    data.budgets.length === 0

  const insight = useMemo(() => {
    if (isEmpty) {
      return 'Mulai dari satu catatan kecil. Daymark akan merangkum sisanya untukmu.'
    }
    const budget = getBudgetSummary(data, month)
    if (budget.warnings.length > 0) {
      const first = budget.warnings[0]
      return `${budget.warnings.length} kategori anggaran mendekati batas, termasuk ${first?.category.name.toLowerCase()}. Sisakan ruang untuk tujuanmu.`
    }
    if (budget.totalBudget > 0) {
      return `Anggaran bulan ini masih sehat — tersisa ${formatMoney(budget.remaining, currency, { compact: true })} untuk kamu kelola.`
    }
    if (data.transactions.length > 0) {
      return `Sudah ${data.transactions.length} transaksi tercatat. Semakin rapi catatanmu, semakin tenang keputusanmu.`
    }
    return 'Satu tempat tenang untuk uang, stok, rencana, dan refleksimu.'
  }, [data, isEmpty, month, currency])

  const focusItems = useMemo(() => {
    const tasks = getTodaysTasks(data.tasks).length
    const upcoming = getUpcomingItems(data, 7, 99).length
    const shopping = getShoppingOverview(data.shoppingLists).activeCount
    return { tasks, upcoming, shopping }
  }, [data])

  const visibleWidgets = data.settings.dashboardWidgets.filter((widget) => widget.visible)

  const loadDemo = () => {
    try {
      actions.loadDemoData()
      toast({
        title: 'Data contoh dimuat',
        description: 'Jelajahi semua fitur, lalu hapus kapan saja dari Settings.',
        tone: 'success',
      })
    } catch (error) {
      toast({
        title: 'Tidak bisa memuat data contoh',
        description: error instanceof Error ? error.message : 'Coba lagi.',
        tone: 'error',
      })
    }
  }

  return (
    <div className="pb-2">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.15em] text-brand">
              <SunMedium size={14} strokeWidth={2.2} aria-hidden="true" />
              Overview
            </span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="text-[0.6875rem] font-semibold text-ink-3">{formatDateLong(today)}</span>
          </div>
          <h1 className="mt-2 text-[1.75rem] font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[2.15rem]">
            {greeting}, <span className="text-gradient">{displayName}</span>.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">{insight}</p>
          {!isEmpty ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Link
                to="/planning"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[0.625rem] font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                <ListChecks size={12} className="text-brand" aria-hidden="true" />
                {focusItems.tasks} tugas fokus
              </Link>
              <Link
                to="/inventory"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[0.625rem] font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                <CalendarClock size={12} className="text-lavender" aria-hidden="true" />
                {focusItems.upcoming} jadwal dekat
              </Link>
              <Link
                to="/shopping"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[0.625rem] font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                <ShoppingBasket size={12} className="text-peach" aria-hidden="true" />
                {focusItems.shopping} daftar belanja
              </Link>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={SlidersHorizontal}
            onClick={() => setSettingsOpen(true)}
            className="bg-surface/80"
          >
            Atur widget
          </Button>
          <Link to="/finance" className={buttonClasses('primary', 'md')}>
            <Wallet size={16} strokeWidth={2.1} aria-hidden="true" />
            Buka Finance
          </Link>
        </div>
      </header>

      {data.meta.demoData && !isEmpty ? (
        <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-warning/20 bg-warning/8 px-3.5 py-2.5">
          <Sparkles size={15} className="text-warning" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[0.6875rem] leading-relaxed text-ink-2">
            Kamu sedang melihat <span className="font-bold text-ink">data contoh</span>. Semua angka bisa
            diubah dan dihapus.
          </p>
          <Link
            to="/settings#data"
            className="focus-ring shrink-0 rounded-lg px-2 py-1 text-[0.625rem] font-bold text-warning hover:bg-warning/10"
          >
            Kelola data
          </Link>
        </div>
      ) : null}

      {isEmpty ? (
        <EmptyDashboard onLoadDemo={loadDemo} />
      ) : visibleWidgets.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <SlidersHorizontal size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Semua widget disembunyikan</h2>
            <p className="mt-1 text-xs text-ink-3">Pilih informasi yang ingin kamu lihat di Overview.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
            Atur widget
          </Button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
          {visibleWidgets.map((widget, index) => {
            const Component = WIDGETS[widget.id]
            if (!Component) return null
            return (
              <motion.div
                layout
                key={widget.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transitions.base, delay: Math.min(index * 0.035, 0.25) }}
                className={cn('col-span-1 min-w-0', WIDGET_SPANS[widget.id])}
              >
                <Component />
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <WidgetSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function EmptyDashboard({ onLoadDemo }: { onLoadDemo: () => void }) {
  const quickLinks = [
    {
      to: '/finance',
      icon: Wallet,
      color: '#2EC4B6',
      title: 'Keuangan',
      description: 'Catat pemasukan, pengeluaran, dan anggaran pertamamu.',
    },
    {
      to: '/shopping',
      icon: ShoppingBasket,
      color: '#F4A261',
      title: 'Belanja',
      description: 'Susun daftar belanja yang rapi dan terukur.',
    },
    {
      to: '/planning',
      icon: ListChecks,
      color: '#5FA8F5',
      title: 'Rencana',
      description: 'Tulis tugas kecil dan atur ritme harianmu.',
    },
    {
      to: '/inventory',
      icon: Boxes,
      color: '#F0B429',
      title: 'Persediaan',
      description: 'Pantau stok dan tanggal kedaluwarsa bahan.',
    },
  ]
  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.base}
        className="surface-card relative overflow-hidden"
      >
        <div className="hero-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky/20 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[0.625rem] font-bold text-brand backdrop-blur dark:border-line dark:bg-surface/55">
              <Sparkles size={12} aria-hidden="true" />
              Mulai dari sini
            </span>
            <h2 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[2rem]">
              Satu ruang untuk hari-harimu.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">
              Catat aliran uang, susun belanja, jaga stok dapur, dan lihat kembali progresmu. Data
              tersimpan lokal di perangkat ini.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/finance" className={buttonClasses('primary', 'md')}>
                Catat transaksi pertama
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Button variant="secondary" size="md" icon={Sparkles} onClick={onLoadDemo} className="bg-white/60 dark:bg-surface/60">
                Lihat dengan data contoh
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.fast, delay: 0.12 + index * 0.05 }}
                >
                  <Link
                    to={link.to}
                    className="focus-ring flex h-full flex-col rounded-2xl border border-white/70 bg-white/48 p-3 backdrop-blur transition-colors hover:bg-white/65 dark:border-line dark:bg-surface/45 dark:hover:bg-surface/70"
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-[10px] border"
                      style={{
                        color: link.color,
                        backgroundColor: `color-mix(in srgb, ${link.color} 11%, transparent)`,
                        borderColor: `color-mix(in srgb, ${link.color} 20%, transparent)`,
                      }}
                    >
                      <Icon size={15} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 text-xs font-bold text-ink">{link.title}</span>
                    <span className="mt-1 text-[0.625rem] leading-relaxed text-ink-3">{link.description}</span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.base, delay: 0.1 }}
        className="surface-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender/10 text-lavender">
            <NotebookPen size={17} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink">Dashboard menyesuaikan dirimu</p>
            <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">
              Setelah ada data, widget bisa diatur urutannya kapan saja lewat tombol “Atur widget”.
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="focus-ring shrink-0 text-[0.6875rem] font-bold text-brand hover:underline"
        >
          Kenali Daymark →
        </Link>
      </motion.div>
    </div>
  )
}
