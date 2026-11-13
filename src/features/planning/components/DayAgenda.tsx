import { AnimatePresence } from 'framer-motion'
import { CalendarPlus, Plus } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/Progress'
import { agendaDateLabel, TaskRow } from '@/features/planning/components/TaskRow'
import { buildTaskDateMap } from '@/features/planning/planning-helpers'
import type { Checklist, Task } from '@/types/domain'

interface DayAgendaProps {
  date: string
  tasks: Task[]
  checklistsById: Map<string, Checklist>
  onAddTask: (date: string) => void
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

/** Selected-day agenda shown under the calendar. */
export function DayAgenda({
  date,
  tasks,
  checklistsById,
  onAddTask,
  onToggle,
  onEdit,
  onDelete,
}: DayAgendaProps) {
  const dayTasks = buildTaskDateMap(tasks).get(date) ?? []
  const done = dayTasks.filter((task) => task.status === 'done').length
  const percent = dayTasks.length > 0 ? (done / dayTasks.length) * 100 : 0

  return (
    <Card padding="md" className="flex flex-col">
      <SectionHeading
        title="Agenda"
        description={agendaDateLabel(date)}
        action={
          <IconButton
            label={`Tambah tugas untuk ${agendaDateLabel(date)}`}
            icon={Plus}
            size="sm"
            variant="soft"
            onClick={() => onAddTask(date)}
          />
        }
      />

      {dayTasks.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarPlus}
          title="Belum ada agenda"
          description="Tambahkan tugas untuk tanggal ini supaya rencananya lebih ringan dijalani."
          action={
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => onAddTask(date)}>
              Tambah tugas
            </Button>
          }
          className="py-6"
        />
      ) : (
        <>
          <ul className="mt-3 space-y-1">
            <AnimatePresence initial={false}>
              {dayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  dense
                  checklist={task.checklistId ? checklistsById.get(task.checklistId) : null}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-auto border-t border-line pt-3">
            <ProgressBar value={percent} color="var(--c-brand)" height="xs" />
            <div className="mt-1.5 flex items-center justify-between text-[0.625rem] font-semibold text-ink-3">
              <span>
                {done}/{dayTasks.length} selesai
              </span>
              <span className="number">{Math.round(percent)}%</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
