import { motion } from 'framer-motion'
import { FolderPlus, Inbox, ListChecks, type LucideIcon } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { checklistProgressMap, type ChecklistFilter } from '@/features/planning/planning-helpers'
import type { Checklist, Task } from '@/types/domain'

interface ChecklistChipProps {
  label: string
  count: number
  color: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}

function ChecklistChip({ label, count, color, icon: Icon, active, onClick }: ChecklistChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-ring relative inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[14px] border px-3 py-1.5 text-left transition-colors duration-200',
        active
          ? 'border-transparent text-ink'
          : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-2 hover:text-ink',
      )}
      style={
        active
          ? {
              backgroundColor: `color-mix(in srgb, ${color} 12%, var(--c-surface))`,
              borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
            }
          : undefined
      }
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border"
        style={{
          color,
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
        }}
        aria-hidden="true"
      >
        <Icon size={14} strokeWidth={2.1} />
      </span>
      <span className="min-w-0 max-w-[10.5rem]">
        <span className="block truncate text-xs font-bold leading-tight">{label}</span>
        <span className="mt-0.5 block text-[0.625rem] font-medium leading-tight text-ink-3">
          {count > 0 ? `${count} tugas` : 'Kosong'}
        </span>
      </span>
      {active ? (
        <motion.span
          layoutId="planning-checklist-chip-active"
          className="pointer-events-none absolute inset-0 rounded-[14px]"
          style={{
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 52%, transparent), 0 8px 20px -16px ${color}`,
          }}
          transition={transitions.spring}
          aria-hidden="true"
        />
      ) : null}
    </button>
  )
}

interface ChecklistSelectorProps {
  checklists: Checklist[]
  tasks: Task[]
  value: ChecklistFilter
  onChange: (value: ChecklistFilter) => void
  onAddChecklist: () => void
}

/** Horizontal checklist filter rail. The first chip always shows every task. */
export function ChecklistSelector({
  checklists,
  tasks,
  value,
  onChange,
  onAddChecklist,
}: ChecklistSelectorProps) {
  const progressById = checklistProgressMap(checklists, tasks)
  const openTasks = tasks.filter((task) => task.status === 'todo').length
  const withoutChecklist = tasks.filter((task) => task.checklistId === null)

  return (
    <div
      role="group"
      aria-label="Filter checklist"
      className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible"
    >
      <ChecklistChip
        label="Semua tugas"
        count={openTasks}
        color="var(--c-brand)"
        icon={ListChecks}
        active={value === 'all'}
        onClick={() => onChange('all')}
      />
      {checklists.map((checklist) => {
        const progress = progressById.get(checklist.id)
        return (
          <button
            key={checklist.id}
            type="button"
            onClick={() => onChange(checklist.id)}
            aria-pressed={value === checklist.id}
            className={cn(
              'focus-ring relative inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[14px] border px-3 py-1.5 text-left transition-colors duration-200',
              value === checklist.id
                ? 'border-transparent text-ink'
                : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-2 hover:text-ink',
            )}
            style={
              value === checklist.id
                ? {
                    backgroundColor: `color-mix(in srgb, ${checklist.color} 12%, var(--c-surface))`,
                    borderColor: `color-mix(in srgb, ${checklist.color} 38%, transparent)`,
                  }
                : undefined
            }
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border"
              style={{
                color: checklist.color,
                backgroundColor: `color-mix(in srgb, ${checklist.color} 12%, transparent)`,
                borderColor: `color-mix(in srgb, ${checklist.color} 22%, transparent)`,
              }}
              aria-hidden="true"
            >
              <DynamicIcon name={checklist.icon} size={14} strokeWidth={2.1} />
            </span>
            <span className="min-w-0 max-w-[10.5rem]">
              <span className="block truncate text-xs font-bold leading-tight">{checklist.name}</span>
              <span className="number mt-0.5 block text-[0.625rem] font-medium leading-tight text-ink-3">
                {progress && progress.total > 0
                  ? `${progress.done}/${progress.total} selesai`
                  : 'Belum ada tugas'}
              </span>
            </span>
            {value === checklist.id ? (
              <motion.span
                layoutId="planning-checklist-chip-active"
                className="pointer-events-none absolute inset-0 rounded-[14px]"
                style={{
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${checklist.color} 52%, transparent), 0 8px 20px -16px ${checklist.color}`,
                }}
                transition={transitions.spring}
                aria-hidden="true"
              />
            ) : null}
          </button>
        )
      })}
      {withoutChecklist.length > 0 ? (
        <ChecklistChip
          label="Tanpa checklist"
          count={withoutChecklist.filter((task) => task.status === 'todo').length}
          color="#8B8FF7"
          icon={Inbox}
          active={value === 'none'}
          onClick={() => onChange('none')}
        />
      ) : null}
      <button
        type="button"
        onClick={onAddChecklist}
        className="focus-ring inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[14px] border border-dashed border-line-strong px-3 text-xs font-semibold text-ink-3 transition-colors hover:border-brand/40 hover:text-brand"
      >
        <FolderPlus size={15} strokeWidth={2.1} aria-hidden="true" />
        Checklist
      </button>
    </div>
  )
}
