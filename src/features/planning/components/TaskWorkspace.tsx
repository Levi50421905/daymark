import { useMemo } from 'react'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ChecklistSelector } from '@/features/planning/components/ChecklistSelector'
import { TaskFiltersBar } from '@/features/planning/components/TaskFiltersBar'
import { TaskList } from '@/features/planning/components/TaskList'
import {
  countTasks,
  filterTasks,
  isFiltersActive,
  DEFAULT_PLANNING_FILTERS,
  type ChecklistFilter,
  type PlanningFilters,
} from '@/features/planning/planning-helpers'
import { todayISO } from '@/lib/dates'
import type { Checklist, Task } from '@/types/domain'

interface TaskWorkspaceProps {
  tasks: Task[]
  checklists: Checklist[]
  checklistsById: Map<string, Checklist>
  filters: PlanningFilters
  onFiltersChange: (patch: Partial<PlanningFilters>) => void
  onSelectChecklist: (value: ChecklistFilter) => void
  onAddTask: () => void
  onAddChecklist: () => void
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

/** Task workspace: checklist filter rail, filter bar, and grouped task buckets. */
export function TaskWorkspace({
  tasks,
  checklists,
  checklistsById,
  filters,
  onFiltersChange,
  onSelectChecklist,
  onAddTask,
  onAddChecklist,
  onToggle,
  onEdit,
  onDelete,
}: TaskWorkspaceProps) {
  const filtered = useMemo(() => filterTasks(tasks, filters), [tasks, filters])
  const counts = useMemo(() => countTasks(tasks, todayISO()), [tasks])
  const filtersActive = isFiltersActive(filters)

  const selectedChecklist = filters.checklistId !== 'all' && filters.checklistId !== 'none'
    ? checklistsById.get(filters.checklistId)
    : null

  const emptyChecklistName =
    selectedChecklist && !filters.search.trim() && filters.status === 'all' && filters.priority === 'all'
      ? selectedChecklist.name
      : null

  const description = selectedChecklist
    ? `Filter: ${selectedChecklist.name}`
    : filters.checklistId === 'none'
      ? 'Tugas tanpa checklist'
      : filtersActive
        ? 'Hasil filter tugasmu'
        : 'Atur prioritas, tenggat, dan rutinitas harianmu.'

  return (
    <Card padding="md" className="flex h-full flex-col">
      <SectionHeading
        title="Tugas"
        description={description}
        action={
          <Badge tone="neutral">
            <span className="number font-bold text-ink-2">{filtered.length}</span>
            <span className="text-ink-3">/ {tasks.length}</span>
          </Badge>
        }
      />

      {checklists.length > 0 ? (
        <div className="mt-4">
          <ChecklistSelector
            checklists={checklists}
            tasks={tasks}
            value={filters.checklistId}
            onChange={onSelectChecklist}
            onAddChecklist={onAddChecklist}
          />
        </div>
      ) : null}

      <div className="mt-3">
        <TaskFiltersBar
          filters={filters}
          counts={counts}
          resultCount={filtered.length}
          active={filtersActive}
          onChange={onFiltersChange}
          onClear={() => onFiltersChange(DEFAULT_PLANNING_FILTERS)}
        />
      </div>

      <div className="mt-5 min-h-0 flex-1">
        <TaskList
          tasks={filtered}
          hasAnyTask={tasks.length > 0}
          filtersActive={filtersActive}
          emptyChecklistName={emptyChecklistName}
          checklistsById={checklistsById}
          onAddTask={onAddTask}
          onAddChecklist={onAddChecklist}
          onClearFilters={() => onFiltersChange(DEFAULT_PLANNING_FILTERS)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </Card>
  )
}
