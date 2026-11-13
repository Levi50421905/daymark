import { motion } from 'framer-motion'
import {
  AlarmClock,
  ArrowRight,
  CalendarRange,
  CheckCheck,
  Plus,
  Sparkles,
} from 'lucide-react'
import { CircularProgress } from '@/components/charts/DonutChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CountUp } from '@/components/ui/CountUp'
import { ProgressBar } from '@/components/ui/Progress'
import { getTaskStats, isTaskOverdue } from '@/lib/calc'
import {
  formatDateLong,
  formatDateRange,
  getWeekRange,
  todayISO,
} from '@/lib/dates'
import { fadeUp, transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Task, WeekStart } from '@/types/domain'

interface ProgressOverviewProps {
  tasks: Task[]
  weekStartsOn: WeekStart
  onAddForToday: () => void
  onOpenTask: (task: Task) => void
}

/** Three calm readouts: today's focus, this week's rhythm, and overdue items. */
export function ProgressOverview({
  tasks,
  weekStartsOn,
  onAddForToday,
  onOpenTask,
}: ProgressOverviewProps) {
  const today = todayISO()
  const todayTasks = tasks.filter((task) => task.dueDate === today)
  const todayDone = todayTasks.filter((task) => task.status === 'done').length
  const todayOpen = todayTasks.length - todayDone
  const todayPercent = todayTasks.length > 0 ? (todayDone / todayTasks.length) * 100 : 0

  const weekRange = getWeekRange(today, weekStartsOn)
  const weekStats = getTaskStats(tasks, weekRange)
  const weekPercent =
    weekStats.total > 0 ? Math.min(100, (weekStats.completed / weekStats.total) * 100) : 0

  const overdue = tasks
    .filter((task) => isTaskOverdue(task, today))
    .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      aria-label="Ringkasan progres tugas"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]"
    >
      <Card
        padding="md"
        className="hero-gradient relative overflow-hidden border-brand/15 sm:col-span-2 xl:col-span-1"
      >
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand/15 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-14 left-10 h-36 w-36 rounded-full bg-lavender/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-4">
          <CircularProgress
            value={todayPercent}
            size={92}
            strokeWidth={8}
            color="var(--c-brand)"
            trackColor="color-mix(in srgb, var(--c-surface) 70%, transparent)"
            ariaLabel={`Progres tugas hari ini ${Math.round(todayPercent)} persen`}
          >
            <span className="number text-xl font-extrabold leading-none text-ink">
              {Math.round(todayPercent)}
              <span className="text-[0.6875rem] font-bold text-ink-3">%</span>
            </span>
            <span className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
              beres
            </span>
          </CircularProgress>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-brand">
              <Sparkles size={12} strokeWidth={2.3} aria-hidden="true" />
              Fokus hari ini
            </p>
            <p className="mt-1 text-lg font-extrabold leading-tight tracking-[-0.03em] text-ink">
              {todayTasks.length > 0 ? (
                <>
                  {todayDone} dari {todayTasks.length} tugas
                </>
              ) : (
                'Ruang yang lapang'
              )}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-3">
              {todayTasks.length > 0
                ? `${formatDateLong(today)} · ${todayOpen} tugas menunggu`
                : 'Belum ada tenggat hari ini. Mau menambahkan satu?'}
            </p>
            {todayTasks.length === 0 ? (
              <Button
                size="sm"
                variant="soft"
                icon={Plus}
                className="mt-2.5"
                onClick={onAddForToday}
              >
                Tugas hari ini
              </Button>
            ) : todayOpen === 0 ? (
              <Badge tone="mint" dot className="mt-2.5">
                Semua beres. Nikmati harimu.
              </Badge>
            ) : (
              <Badge tone="brand" dot className="mt-2.5">
                {todayOpen} tersisa
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Card padding="md" className="relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-sky">
              <CalendarRange size={12} strokeWidth={2.3} aria-hidden="true" />
              Minggu ini
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <CountUp
                value={weekStats.completed}
                className="text-3xl font-extrabold leading-none tracking-[-0.04em] text-ink"
              />
              <span className="text-xs font-semibold text-ink-3">tugas selesai</span>
            </p>
            <p className="mt-1 text-[0.6875rem] font-medium text-ink-3">
              {formatDateRange(weekRange.start, weekRange.end)}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-sky/25 bg-sky/10 text-sky">
            <CheckCheck size={17} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={weekPercent} color="var(--c-sky)" height="sm" />
          <div className="mt-1.5 flex items-center justify-between text-[0.625rem] font-semibold">
            <span className="text-ink-3">
              {weekStats.completed} dari {weekStats.total} dalam lingkup minggu
            </span>
            <span className="number text-ink-2">{Math.round(weekPercent)}%</span>
          </div>
        </div>
      </Card>

      <Card padding="md" className="relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                'flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em]',
                overdue.length > 0 ? 'text-danger' : 'text-success',
              )}
            >
              <AlarmClock size={12} strokeWidth={2.3} aria-hidden="true" />
              Terlambat
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <motion.span
                key={overdue.length}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.springSoft}
                className={cn(
                  'number text-3xl font-extrabold leading-none tracking-[-0.04em]',
                  overdue.length > 0 ? 'text-danger' : 'text-ink',
                )}
              >
                {overdue.length}
              </motion.span>
              <span className="text-xs font-semibold text-ink-3">tugas</span>
            </p>
          </div>
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border',
              overdue.length > 0
                ? 'border-danger/25 bg-danger/10 text-danger'
                : 'border-success/25 bg-success/10 text-success',
            )}
          >
            <CheckCheck size={17} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>

        {overdue.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {overdue.slice(0, 2).map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onOpenTask(task)}
                  className="focus-ring group flex w-full items-center gap-1.5 rounded-lg px-1 py-1 text-left transition-colors hover:bg-danger/5"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-semibold text-ink-2">
                    {task.title}
                  </span>
                  <ArrowRight
                    size={12}
                    className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
            {overdue.length > 2 ? (
              <li className="px-1 text-[0.625rem] font-semibold text-ink-3">
                +{overdue.length - 2} tugas terlambat lainnya
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-3">
            Tidak ada yang tertinggal. Jaga ritme yang nyaman.
          </p>
        )}
      </Card>
    </motion.section>
  )
}
