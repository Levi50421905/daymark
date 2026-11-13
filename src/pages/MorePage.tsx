import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BellRing,
  ChevronRight,
  CircleCheck,
  CloudOff,
  Download,
  HardDrive,
  ListChecks,
  NotebookPen,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
} from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusDot } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import {
  getPackageSummary,
  getTaskStats,
  getUpcomingSubscriptions,
  getMonthlySubscriptionCost,
} from '@/lib/calc'
import { formatDateRange, relativeTimeLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { transitions } from '@/lib/motion'
import { useAppData, useAppStore } from '@/lib/store'
import { APP_NAME, APP_VERSION } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  to: string
  icon: typeof ListChecks
  color: string
  gradient: string
  eyebrow: string
  title: string
  description: string
  stat?: string
  statLabel?: string
  badge?: string
  index: number
}

function FeatureCard({
  to,
  icon: Icon,
  color,
  gradient,
  eyebrow,
  title,
  description,
  stat,
  statLabel,
  badge,
  index,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitions.base, delay: index * 0.05 }}
    >
      <Link
        to={to}
        className="focus-ring group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface p-5 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
      >
        <div className={cn('pointer-events-none absolute inset-0 opacity-80', gradient)} aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm"
            style={{
              color,
              backgroundColor: `color-mix(in srgb, ${color} 12%, var(--c-surface))`,
              borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
            }}
          >
            <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <ArrowUpRight
            size={17}
            className="text-ink-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
            aria-hidden="true"
          />
        </div>
        <div className="relative z-10 mt-4 flex flex-1 flex-col">
          <span className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-ink-3">{eyebrow}</span>
          <h2 className="mt-1 text-base font-extrabold tracking-[-0.03em] text-ink">{title}</h2>
          <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">{description}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              {stat ? <p className="number text-lg font-extrabold tracking-[-0.03em] text-ink">{stat}</p> : null}
              {statLabel ? <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">{statLabel}</p> : null}
            </div>
            {badge ? (
              <span className="rounded-full border border-line bg-surface/70 px-2 py-0.5 text-[0.5625rem] font-bold text-ink-2">
                {badge}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function MorePage() {
  const data = useAppData()
  const { saveStatus, lastSavedAt } = useAppStore()
  const toast = useToast()
  const online = useOnlineStatus()
  const install = useInstallPrompt()
  const currency = data.settings.currency
  const taskStats = getTaskStats(data.tasks)
  const packageSummary = getPackageSummary(data.dataPackages)
  const subscriptions = data.subscriptions.filter((subscription) => subscription.active)
  const upcoming = getUpcomingSubscriptions(data.subscriptions, 14)
  const monthlyCost = getMonthlySubscriptionCost(data.subscriptions)
  const latestReview = [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const displayName = data.settings.userName.trim() || 'Sahabat'

  const handleInstall = async () => {
    const outcome = await install.promptInstall()
    if (outcome === 'accepted') {
      toast({ title: 'Daymark dipasang', description: 'Buka dari layar utama kapan saja.', tone: 'success' })
    } else if (outcome === 'dismissed') {
      toast({ title: 'Instalasi dibatalkan', tone: 'default' })
    } else {
      toast({
        title: 'Gunakan menu browser',
        description: 'Pilih “Install app” atau “Tambahkan ke layar utama” dari menu browser.',
        tone: 'info',
      })
    }
  }

  const internetAlert = packageSummary.lowCount + upcoming.length
  const openTasks = data.tasks.filter((task) => task.status === 'todo').length

  return (
    <div>
      <PageHeader
        eyebrow="More"
        title="Semua fitur, satu ruang"
        description="Akses fitur pendukung, atur preferensi, dan jaga datamu tetap aman di perangkat ini."
        actions={
          <Link to="/settings" className={buttonClasses('secondary', 'md')}>
            <Settings2 size={16} aria-hidden="true" />
            Pengaturan
          </Link>
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.base}
        className="surface-card relative mb-5 overflow-hidden"
      >
        <div className="hero-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-lavender/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[0.625rem] font-bold text-brand backdrop-blur dark:border-line dark:bg-surface/55">
              <ShieldCheck size={12} aria-hidden="true" />
              Local-first · tanpa akun
            </span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.04em] text-ink">
              Datamu tinggal di perangkatmu, {displayName}.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">
              Tidak ada server, tidak ada langganan. Semua perubahan disimpan otomatis ke IndexedDB
              dan aplikasi tetap bisa dipakai saat offline.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/settings#data" className={buttonClasses('primary', 'md')}>
                <HardDrive size={16} aria-hidden="true" />
                Kelola data & backup
              </Link>
              {!install.installed ? (
                <Button
                  variant="secondary"
                  size="md"
                  icon={install.canInstall ? Download : Smartphone}
                  onClick={() => void (install.canInstall ? handleInstall() : toast({
                    title: install.isIos ? 'Tambahkan ke Layar Utama' : 'Pasang lewat menu browser',
                    description: install.isIos
                      ? 'Buka menu Bagikan di Safari, lalu pilih “Tambah ke Layar Utama”.'
                      : 'Buka menu browser dan pilih “Install app” / “Tambahkan ke layar utama”.',
                    tone: 'info',
                  }))}
                  className="bg-white/60 dark:bg-surface/60"
                >
                  Pasang Daymark
                </Button>
              ) : (
                <span className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-success/20 bg-success/10 px-4 text-[0.8125rem] font-semibold text-success">
                  <CircleCheck size={16} />
                  Aplikasi terpasang
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/70 bg-white/48 p-3.5 backdrop-blur dark:border-line dark:bg-surface/45">
              <div className="flex items-center gap-1.5 text-[0.625rem] font-semibold text-ink-3">
                <StatusDot
                  tone={saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'warning' : 'success'}
                  pulse={saveStatus === 'saving'}
                />
                Penyimpanan
              </div>
              <p className="mt-2 text-sm font-extrabold text-ink">
                {saveStatus === 'saving' ? 'Menyimpan…' : saveStatus === 'error' ? 'Perlu perhatian' : 'Aman'}
              </p>
              <p className="mt-0.5 truncate text-[0.625rem] text-ink-3">
                {lastSavedAt ? relativeTimeLabel(lastSavedAt) : 'Belum tersimpan'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/48 p-3.5 backdrop-blur dark:border-line dark:bg-surface/45">
              <div className="flex items-center gap-1.5 text-[0.625rem] font-semibold text-ink-3">
                {online ? <Wifi size={12} /> : <CloudOff size={12} />}
                Koneksi
              </div>
              <p className="mt-2 text-sm font-extrabold text-ink">{online ? 'Online' : 'Offline'}</p>
              <p className="mt-0.5 text-[0.625rem] text-ink-3">
                {online ? 'Sinkronisasi tidak diperlukan' : 'Fitur utama tetap berjalan'}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/70 bg-white/48 px-3.5 py-2.5 backdrop-blur dark:border-line dark:bg-surface/45">
              <div>
                <p className="text-[0.625rem] font-semibold text-ink-3">Backup terakhir</p>
                <p className="mt-0.5 text-xs font-bold text-ink">
                  {data.meta.lastBackupAt ? relativeTimeLabel(data.meta.lastBackupAt) : 'Belum pernah'}
                </p>
              </div>
              <Link
                to="/settings#data"
                className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.625rem] font-bold text-brand hover:bg-brand/5"
              >
                Ekspor <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="mb-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold tracking-[-0.02em] text-ink">Workspace</h2>
            <p className="mt-0.5 text-[0.6875rem] text-ink-3">Fitur pendukung di luar navigasi utama.</p>
          </div>
          <span className="text-[0.625rem] font-semibold text-ink-3">4 area</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FeatureCard
            to="/planning"
            icon={ListChecks}
            color="#2EC4B6"
            gradient="bg-gradient-to-br from-brand/8 via-transparent to-transparent"
            eyebrow="Planning"
            title="Rencana & tugas"
            description="Checklist, prioritas, kalender, dan progres aktivitas dalam satu tempat."
            stat={`${openTasks} tugas terbuka`}
            statLabel={taskStats.dueToday > 0 ? `${taskStats.dueToday} jatuh tempo hari ini` : 'Tidak ada yang mendesak'}
            badge={taskStats.overdue > 0 ? `${taskStats.overdue} terlambat` : undefined}
            index={0}
          />
          <FeatureCard
            to="/internet"
            icon={Wifi}
            color="#5FA8F5"
            gradient="bg-gradient-to-br from-sky/8 via-transparent to-transparent"
            eyebrow="Connectivity"
            title="Internet & langganan"
            description="Kuota, perangkat, paket data, dan pembayaran langganan rutin."
            stat={`${packageSummary.active.length} paket aktif`}
            statLabel={`${formatMoney(monthlyCost, currency, { compact: true })} / bulan langganan`}
            badge={internetAlert > 0 ? `${internetAlert} perlu dicek` : undefined}
            index={1}
          />
          <FeatureCard
            to="/reviews"
            icon={NotebookPen}
            color="#8B8FF7"
            gradient="bg-gradient-to-br from-lavender/8 via-transparent to-transparent"
            eyebrow="Reflection"
            title="Periodic review"
            description="Lihat kembali pengeluaran, progres, dan refleksi dalam periode pilihan."
            stat={latestReview ? `${latestReview.snapshot.tasksCompleted} aktivitas selesai` : 'Belum ada evaluasi'}
            statLabel={latestReview ? formatDateRange(latestReview.periodStart, latestReview.periodEnd) : 'Mulai evaluasi pertamamu'}
            badge={latestReview ? `Terakhir ${relativeTimeLabel(latestReview.createdAt).toLowerCase()}` : 'Baru'}
            index={2}
          />
          <FeatureCard
            to="/settings"
            icon={Settings2}
            color="#F4A261"
            gradient="bg-gradient-to-br from-peach/10 via-transparent to-transparent"
            eyebrow="Preferences"
            title="Settings & data"
            description="Nama, mata uang, tema, widget, backup, dan status aplikasi."
            stat={`${data.settings.currency} · ${data.settings.theme === 'system' ? 'ikuti sistem' : data.settings.theme === 'dark' ? 'mode gelap' : 'mode terang'}`}
            statLabel={`${data.transactions.length} transaksi · ${data.reviews.length} evaluasi`}
            index={3}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.base, delay: 0.2 }}
          className="surface-card p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint/12 text-success">
              <Sparkles size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-ink">Tentang Daymark</h2>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
                Personal life planner untuk keuangan, belanja, stok, rencana, dan refleksi. Dibuat untuk
                digunakan setiap hari — bukan sekadar dilihat.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
            <div>
              <p className="text-[0.5625rem] font-semibold uppercase tracking-wide text-ink-3">Versi</p>
              <p className="mt-0.5 text-xs font-bold text-ink">{APP_VERSION}</p>
            </div>
            <div>
              <p className="text-[0.5625rem] font-semibold uppercase tracking-wide text-ink-3">Akun</p>
              <p className="mt-0.5 text-xs font-bold text-ink">Tidak perlu</p>
            </div>
            <div>
              <p className="text-[0.5625rem] font-semibold uppercase tracking-wide text-ink-3">Data</p>
              <p className="mt-0.5 text-xs font-bold text-ink">Lokal</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.base, delay: 0.24 }}
          className="surface-card flex flex-col justify-between gap-4 p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lavender/10 text-lavender">
              <BellRing size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-ink">Pengingat yang tenang</h2>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
                Daymark menampilkan peringatan stok, kedaluwarsa, dan pembayaran di dalam aplikasi.
                Tidak ada notifikasi paksa atau email.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/inventory"
              className="focus-ring rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[0.625rem] font-bold text-ink-2 hover:border-line-strong"
            >
              {data.inventory.length} barang stok
            </Link>
            <Link
              to="/internet"
              className="focus-ring rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[0.625rem] font-bold text-ink-2 hover:border-line-strong"
            >
              {subscriptions.length} langganan aktif
            </Link>
            <span className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[0.625rem] font-bold text-ink-2">
              {APP_NAME} v{APP_VERSION}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
