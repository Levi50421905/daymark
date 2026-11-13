import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Check, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { PRIORITY_META } from '@/lib/constants'
import { formatDateLong, formatDateMedium, isToday, relativeDueLabel, todayISO } from '@/lib/dates'
import { listItem, transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { categoryColor } from '@/features/planning/planning-helpers'
import type { Checklist, Task } from '@/types/domain'

function CompletionCheckbox({ task, onToggle }: { task: Task; onToggle: (task: Task) => void }) {
  const done = task.status === 'done'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Buka kembali tugas ${task.title}` : `Selesaikan tugas ${task.title}`}
      onClick={() => onToggle(task)}
      className="focus-ring -ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
    >
      <motion.span
        whileTap={{ scale: 0.88 }}
        transition={transitions.springSnappy}
        className={cn(
          'flex h-[23px] w-[23px] items-center justify-center rounded-[7px] border-2 transition-colors duration-200',
          done
            ? 'border-brand bg-brand'
            : 'border-line-strong bg-surface group-hover:border-brand/55',
        )}
        aria-hidden="true"
      >
        <AnimatePresence initial={false}>
          {done ? (
            <motion.span
              initial={{ scale: 0.4, opacity: 0, rotate: -16 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={transitions.springSnappy}
              className="text-white"
            >
              <Check size={14} strokeWidth={3.2} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.span>
    </button>
  )
}

function MetaChip({
  icon,
  children,
  color,
  className,
}: {
  icon: ReactNode
  children: ReactNode
  color?: string
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[0.6875rem] font-medium text-ink-3', className)}
      style={color ? { color } : undefined}
    >
      {icon}
      {children}
    </span>
  )
}

interface TaskRowProps {
  task: Task
  checklist?: Checklist | null
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  dense?: boolean
}

export function TaskRow({ task, checklist, onToggle, onEdit, onDelete, dense = false }: TaskRowProps) {
  const done = task.status === 'done'
  const priority = PRIORITY_META[task.priority]
  const today = todayISO()
  const overdue = !done && task.dueDate !== null && task.dueDate < today
  const dueToday = !done && task.dueDate === today
  const categoryAccent = categoryColor(task.category)

  return (
    <motion.li
      layout
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'group flex items-start gap-1.5 rounded-[18px] border px-1 py-1.5 transition-colors sm:px-2',
        done
          ? 'border-line/70 bg-surface-2/65'
          : 'border-line/85 bg-surface hover:border-line-strong hover:bg-surface-2/40',
        dense &&
          'border-transparent bg-transparent px-0.5 py-0.5 hover:border-transparent hover:bg-surface-2/60',
      )}
    >
      <CompletionCheckbox task={task} onToggle={onToggle} />
      <div className="min-w-0 flex-1 py-1">
        <p
          className={cn(
            'text-[0.8125rem] font-semibold leading-snug tracking-[-0.01em]',
            done ? 'text-ink-3 line-through decoration-ink-3/40' : 'text-ink',
            dense && 'text-[0.78rem]',
          )}
        >
          {task.title}
        </p>

        {!dense ? (
          <>
            {task.notes ? (
              <p className="mt-0.5 line-clamp-1 text-[0.71875rem] leading-relaxed text-ink-3">
                {task.notes}
              </p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <Badge tone={priority.tone} dot>
                {priority.label}
              </Badge>
              <MetaChip
                icon={<span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryAccent }} />}
              >
                {task.category}
              </MetaChip>
              {checklist ? (
                <MetaChip
                  icon={<DynamicIcon name={checklist.icon} size={11.5} strokeWidth={2.2} />}
                  color={checklist.color}
                >
                  {checklist.name}
                </MetaChip>
              ) : null}
              {task.dueDate ? (
                <MetaChip
                  icon={<CalendarClock size={11.5} strokeWidth={2.2} />}
                  color={overdue ? 'var(--c-danger)' : dueToday ? 'var(--c-warning)' : undefined}
                  className={cn(overdue && 'font-bold', dueToday && 'font-bold')}
                >
                  {overdue ? `Terlambat · ${formatDateMedium(task.dueDate)}` : relativeDueLabel(task.dueDate)}
                </MetaChip>
              ) : (
                <MetaChip icon={<CalendarClock size={11.5} strokeWidth={2.2} />}>Tanpa tenggat</MetaChip>
              )}
              {done && task.completedAt ? (
                <span className="text-[0.6875rem] font-medium text-success/90">
                  Selesai {formatDateMedium(task.completedAt.slice(0, 10))}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[0.625rem] font-semibold"
              style={{ color: priority.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
              {priority.label}
            </span>
            {task.dueDate ? (
              <span
                className={cn(
                  'text-[0.625rem] font-medium text-ink-3',
                  overdue && 'font-bold text-danger',
                  dueToday && 'font-bold text-warning',
                )}
              >
                {overdue ? 'Terlambat' : dueToday ? 'Hari ini' : formatDateMedium(task.dueDate)}
              </span>
            ) : null}
            {checklist ? (
              <span
                className="inline-flex items-center gap-1 text-[0.625rem] font-medium"
                style={{ color: checklist.color }}
              >
                <DynamicIcon name={checklist.icon} size={10.5} strokeWidth={2.2} />
                {checklist.name}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
        <IconButton
          label={`Edit tugas ${task.title}`}
          icon={Pencil}
          size="sm"
          onClick={() => onEdit(task)}
        />
        <IconButton
          label={`Hapus tugas ${task.title}`}
          icon={Trash2}
          size="sm"
          variant="danger"
          onClick={() => onDelete(task)}
        />
      </div>
    </motion.li>
  )
}

/** Small helper used by the calendar agenda to describe a date. */
export function agendaDateLabel(dateIso: string): string {
  return isToday(dateIso) ? `Hari ini · ${formatDateLong(dateIso)}` : formatDateLong(dateIso)
}
