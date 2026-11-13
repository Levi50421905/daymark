import { AnimatePresence, motion } from 'framer-motion'
import {
  AlarmClock,
  CalendarClock,
  CheckCheck,
  FolderPlus,
  Inbox,
  ListChecks,
  Plus,
  SearchX,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskRow } from '@/features/planning/components/TaskRow'
import { getTaskBuckets, type TaskBucket } from '@/lib/calc'
import type { Checklist, Task } from '@/types/domain'

const BUCKET_META: Record<
  TaskBucket['id'],
  { icon: LucideIcon; accent: string; hint?: string }
> = {
  overdue: {
    icon: AlarmClock,
    accent: 'var(--c-danger)',
    hint: 'Lewat tenggat. Selesaikan atau jadwalkan ulang.',
  },
  today: { icon: Sun, accent: 'var(--c-brand)' },
  upcoming: { icon: CalendarClock, accent: 'var(--c-sky)' },
  someday: { icon: Inbox, accent: 'var(--c-lavender)' },
  done: { icon: CheckCheck, accent: 'var(--c-mint)' },
}

interface TaskListProps {
  tasks: Task[]
  hasAnyTask: boolean
  filtersActive: boolean
  emptyChecklistName?: string | null
  checklistsById: Map<string, Checklist>
  onAddTask: () => void
  onAddChecklist: () => void
  onClearFilters: () => void
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList({
  tasks,
  hasAnyTask,
  filtersActive,
  emptyChecklistName,
  checklistsById,
  onAddTask,
  onAddChecklist,
  onClearFilters,
  onToggle,
  onEdit,
  onDelete,
}: TaskListProps) {
  const buckets = getTaskBuckets(tasks)

  if (buckets.length === 0) {
    if (!hasAnyTask) {
      return (
        <EmptyState
          icon={ListChecks}
          title="Belum ada tugas"
          description="Mulai dari satu langkah kecil. Tugas bisa punya prioritas, tenggat, dan masuk ke checklist."
          action={
            <Button icon={Plus} onClick={onAddTask}>
              Tugas pertama
            </Button>
          }
          secondaryAction={
            <Button variant="secondary" icon={FolderPlus} onClick={onAddChecklist}>
              Buat checklist
            </Button>
          }
        />
      )
    }
    if (emptyChecklistName) {
      return (
        <EmptyState
          icon={FolderPlus}
          title="Checklist ini masih kosong"
          description={`Tambahkan tugas pertama ke "${emptyChecklistName}", atau tampilkan semua tugas.`}
          action={
            <Button icon={Plus} onClick={onAddTask}>
              Tugas untuk checklist
            </Button>
          }
          secondaryAction={
            <Button variant="secondary" onClick={onClearFilters}>
              Semua tugas
            </Button>
          }
        />
      )
    }
    return (
      <EmptyState
        icon={SearchX}
        title="Tidak ada tugas yang cocok"
        description="Coba kata kunci lain, ganti filter, atau tampilkan semua tugas."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Hapus filter
          </Button>
        }
        secondaryAction={
          filtersActive ? (
            <Button variant="ghost" icon={Plus} onClick={onAddTask}>
              Tugas baru
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <AnimatePresence initial={false}>
        {buckets.map((bucket) => {
          const meta = BUCKET_META[bucket.id]
          const Icon = meta.icon
          return (
            <motion.section
              key={bucket.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.24, ease: [0.22, 0.8, 0.28, 1] }}
              aria-labelledby={`bucket-${bucket.id}`}
            >
              <header className="mb-2 flex flex-wrap items-center gap-2 px-1">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-[9px] border"
                  style={{
                    color: meta.accent,
                    backgroundColor: `color-mix(in srgb, ${meta.accent} 11%, transparent)`,
                    borderColor: `color-mix(in srgb, ${meta.accent} 22%, transparent)`,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={14} strokeWidth={2.2} />
                </span>
                <h3
                  id={`bucket-${bucket.id}`}
                  className="text-[0.8125rem] font-bold tracking-[-0.01em] text-ink"
                >
                  {bucket.label}
                </h3>
                <Badge tone={bucket.id === 'overdue' ? 'rose' : 'neutral'} dot color={meta.accent}>
                  {bucket.tasks.length}
                </Badge>
                {meta.hint ? (
                  <span className="hidden text-[0.6875rem] font-medium text-ink-3 sm:inline">
                    {meta.hint}
                  </span>
                ) : null}
              </header>
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {bucket.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      checklist={task.checklistId ? checklistsById.get(task.checklistId) : null}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
