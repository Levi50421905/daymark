import { motion } from 'framer-motion'
import { FolderPlus, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/Progress'
import { listItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { checklistProgressMap, type ChecklistFilter } from '@/features/planning/planning-helpers'
import type { Checklist, Task } from '@/types/domain'

interface ChecklistManagerProps {
  checklists: Checklist[]
  tasks: Task[]
  value: ChecklistFilter
  onSelect: (value: ChecklistFilter) => void
  onAdd: () => void
  onEdit: (checklist: Checklist) => void
  onDelete: (checklist: Checklist) => void
}

/** CRUD surface for checklists with real progress from the shared calculator. */
export function ChecklistManager({
  checklists,
  tasks,
  value,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: ChecklistManagerProps) {
  const progressById = checklistProgressMap(checklists, tasks)
  const openTasks = tasks.filter((task) => task.status === 'todo').length
  const doneTasks = tasks.filter((task) => task.status === 'done').length

  return (
    <Card padding="md" className="flex flex-col">
      <SectionHeading
        title="Checklist"
        description="Kelompokkan tugas jadi rutinitas kecil."
        action={
          <Button variant="soft" size="sm" icon={Plus} onClick={onAdd} aria-label="Checklist baru">
            Baru
          </Button>
        }
      />

      <button
        type="button"
        onClick={() => onSelect('all')}
        aria-pressed={value === 'all'}
        className={cn(
          'focus-ring mt-4 flex w-full items-center gap-3 rounded-[16px] border px-3 py-2.5 text-left transition-colors',
          value === 'all'
            ? 'border-brand/30 bg-brand/8'
            : 'border-line bg-surface-2/60 hover:border-line-strong hover:bg-surface-2',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-brand/20 bg-brand/10 text-brand">
          <ListChecks size={17} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-bold text-ink">Semua tugas</span>
          <span className="mt-0.5 block text-[0.6875rem] font-medium text-ink-3">
            {openTasks} aktif · {doneTasks} selesai
          </span>
        </span>
        {value === 'all' ? <Badge tone="brand">Dipilih</Badge> : null}
      </button>

      {checklists.length === 0 ? (
        <EmptyState
          compact
          icon={FolderPlus}
          title="Belum ada checklist"
          description="Buat checklist untuk rutinitas pagi, persiapan minggu, atau urusan rumah."
          action={
            <Button size="sm" variant="secondary" icon={FolderPlus} onClick={onAdd}>
              Checklist baru
            </Button>
          }
          className="py-6"
        />
      ) : (
        <ul className="mt-2.5 space-y-2">
          {checklists.map((checklist) => {
            const progress = progressById.get(checklist.id)
            const total = progress?.total ?? 0
            const done = progress?.done ?? 0
            const percent = progress?.progress ?? 0
            const selected = value === checklist.id
            return (
              <motion.li key={checklist.id} layout variants={listItem} initial="hidden" animate="visible">
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-[16px] border px-2 py-2 transition-colors',
                    selected
                      ? 'border-brand/25 bg-surface'
                      : 'border-line bg-surface-2/50 hover:border-line-strong hover:bg-surface-2',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(checklist.id)}
                    aria-pressed={selected}
                    className="focus-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 text-left"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border"
                      style={{
                        color: checklist.color,
                        backgroundColor: `color-mix(in srgb, ${checklist.color} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${checklist.color} 24%, transparent)`,
                      }}
                      aria-hidden="true"
                    >
                      <DynamicIcon name={checklist.icon} size={17} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[0.8125rem] font-semibold text-ink">
                          {checklist.name}
                        </span>
                        {selected ? (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: checklist.color }}
                            aria-label="Filter aktif"
                          />
                        ) : null}
                      </span>
                      <span className="number mt-0.5 block text-[0.625rem] font-medium text-ink-3">
                        {total > 0 ? `${done}/${total} selesai` : 'Belum ada tugas'}
                      </span>
                      <ProgressBar
                        value={percent}
                        color={checklist.color}
                        height="xs"
                        className="mt-1.5"
                        trackClassName="bg-surface-3"
                      />
                    </span>
                  </button>
                  <IconButton
                    label={`Edit checklist ${checklist.name}`}
                    icon={Pencil}
                    size="sm"
                    onClick={() => onEdit(checklist)}
                  />
                  <IconButton
                    label={`Hapus checklist ${checklist.name}`}
                    icon={Trash2}
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(checklist)}
                  />
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
