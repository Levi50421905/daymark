import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ListChecks } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CircularProgress } from '@/components/charts/DonutChart'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { getTaskStats } from '@/lib/calc'
import { getWeekRange, relativeDueLabel, todayISO } from '@/lib/dates'
import { listItem, transitions } from '@/lib/motion'
import { actions, useAppData } from '@/lib/store'
import { PRIORITY_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'

function TaskCheck({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={task.status === 'done'}
      aria-label={task.status === 'done' ? `Buka kembali ${task.title}` : `Selesaikan ${task.title}`}
      onClick={onToggle}
      whileTap={{ scale: 0.85 }}
      transition={transitions.springSnappy}
      className={cn(
        'focus-ring relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border transition-colors',
        task.status === 'done'
          ? 'border-brand bg-brand text-white'
          : 'border-line-strong bg-surface hover:border-brand/60',
      )}
    >
      <AnimatePresence>
        {task.status === 'done' ? (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={transitions.springSnappy}
            className="flex items-center justify-center"
          >
            <Check size={12} strokeWidth={3.2} aria-hidden="true" />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  )
}

export function TasksWidget() {
  const data = useAppData()
  const toast = useToast()
  const today = todayISO()
  const stats = getTaskStats(data.tasks, getWeekRange(today))
  const focusTasks = useMemo(() => {
    const byStatus = (task: Task) => (task.status === 'done' ? 1 : 0)
    const due = data.tasks
      .filter((task) => task.dueDate !== null && task.dueDate <= today)
      .sort((a, b) => {
        const status = byStatus(a) - byStatus(b)
        if (status !== 0) return status
        if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
        const priority = { high: 0, medium: 1, low: 2 }
        return priority[a.priority] - priority[b.priority]
      })
    const upcoming = data.tasks
      .filter((task) => task.status === 'todo' && task.dueDate !== null && task.dueDate > today)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    return [...due, ...upcoming].slice(0, 3)
  }, [data.tasks, today])
  const doneToday = data.tasks.filter(
    (task) => task.status === 'done' && task.completedAt?.slice(0, 10) === today,
  ).length
  const dueToday = data.tasks.filter((task) => task.dueDate === today).length

  const handleToggle = (task: Task) => {
    actions.toggleTask(task.id)
    toast({
      title: task.status === 'done' ? 'Tugas dibuka kembali' : 'Tugas selesai',
      description: task.title,
      tone: task.status === 'done' ? 'default' : 'success',
    })
  }

  return (
    <WidgetShell
      title="Aktivitas & checklist"
      description={`${doneToday} selesai hari ini${dueToday ? ` · ${dueToday} jatuh tempo` : ''}`}
      icon="ListChecks"
      iconColor="#2EC4B6"
      action={<WidgetLink to="/planning" label="Buka" />}
    >
      {focusTasks.length === 0 ? (
        <EmptyState
          compact
          icon={ListChecks}
          title="Hari ini masih lapang"
          description="Tambahkan tugas kecil untuk menjaga ritme."
          className="py-5"
          action={
            <Link to="/planning" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Tambah tugas →
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2/80 px-3 py-2">
            <CircularProgress
              value={stats.progress}
              size={38}
              strokeWidth={4}
              ariaLabel="Progress aktivitas minggu ini"
            >
              <span className="text-[0.5625rem] font-extrabold text-ink">{Math.round(stats.progress)}%</span>
            </CircularProgress>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold text-ink">Progres minggu ini</p>
              <p className="text-[0.625rem] text-ink-3">
                {stats.completed} dari {stats.total} aktivitas selesai
              </p>
            </div>
          </div>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {focusTasks.map((task) => {
                const overdue = task.status === 'todo' && task.dueDate && task.dueDate < today
                return (
                  <motion.li
                    layout
                    key={task.id}
                    variants={listItem}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="group flex items-start gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-2"
                  >
                    <TaskCheck task={task} onToggle={() => handleToggle(task)} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-xs font-semibold transition-colors',
                          task.status === 'done' ? 'text-ink-3 line-through' : 'text-ink',
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {task.dueDate ? (
                          <span
                            className={cn(
                              'text-[0.5625rem] font-semibold',
                              overdue ? 'text-danger' : 'text-ink-3',
                            )}
                          >
                            {relativeDueLabel(task.dueDate)}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1 text-[0.5625rem] font-medium text-ink-3">
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{ backgroundColor: PRIORITY_META[task.priority].color }}
                            aria-hidden="true"
                          />
                          {PRIORITY_META[task.priority].label}
                        </span>
                        {task.checklistId ? (
                          <Badge tone="neutral" className="py-0 text-[0.5rem]">
                            {data.checklists.find((item) => item.id === task.checklistId)?.name ?? 'Checklist'}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </>
      )}
    </WidgetShell>
  )
}
