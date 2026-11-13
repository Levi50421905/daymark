import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, FolderKanban, FolderPlus, ListChecks, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { isSameMonth, monthKeyOf, todayISO } from '@/lib/dates'
import { transitions } from '@/lib/motion'
import { actions, useAppData } from '@/lib/store'
import { ChecklistFormModal } from '@/features/planning/components/ChecklistFormModal'
import { ChecklistManager } from '@/features/planning/components/ChecklistManager'
import { DayAgenda } from '@/features/planning/components/DayAgenda'
import { MonthCalendar } from '@/features/planning/components/MonthCalendar'
import { ProgressOverview } from '@/features/planning/components/ProgressOverview'
import { TaskFormModal } from '@/features/planning/components/TaskFormModal'
import { TaskWorkspace } from '@/features/planning/components/TaskWorkspace'
import {
  DEFAULT_PLANNING_FILTERS,
  categoryOptions,
  countTasks,
  type ChecklistFilter,
  type PlanningFilters,
  type PlanningTab,
} from '@/features/planning/planning-helpers'
import type { Checklist, Task } from '@/types/domain'

interface TaskFormState {
  open: boolean
  task: Task | null
  defaultDate: string | null
  defaultChecklistId: string | null
}

interface ChecklistFormState {
  open: boolean
  checklist: Checklist | null
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'
}

export default function PlanningPage() {
  const data = useAppData()
  const toast = useToast()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const [tab, setTab] = useState<PlanningTab>('tasks')
  const [filters, setFilters] = useState<PlanningFilters>(DEFAULT_PLANNING_FILTERS)
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyOf())
  const [taskForm, setTaskForm] = useState<TaskFormState>({
    open: false,
    task: null,
    defaultDate: null,
    defaultChecklistId: null,
  })
  const [checklistForm, setChecklistForm] = useState<ChecklistFormState>({
    open: false,
    checklist: null,
  })
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null)

  const checklistsById = useMemo(
    () => new Map(data.checklists.map((checklist) => [checklist.id, checklist])),
    [data.checklists],
  )
  const categories = useMemo(() => categoryOptions(data.tasks), [data.tasks])
  const counts = useMemo(() => countTasks(data.tasks, todayISO()), [data.tasks])

  const patchFilters = (patch: Partial<PlanningFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }

  const openCreateTask = (options: { date?: string | null; checklistId?: string | null } = {}) => {
    const checklistId =
      options.checklistId ??
      (filters.checklistId !== 'all' && filters.checklistId !== 'none'
        ? filters.checklistId
        : null)
    setTaskForm({ open: true, task: null, defaultDate: options.date ?? null, defaultChecklistId: checklistId })
  }

  const openEditTask = (task: Task) => {
    setTaskForm({ open: true, task, defaultDate: null, defaultChecklistId: null })
  }

  const closeTaskForm = () => setTaskForm((current) => ({ ...current, open: false }))

  const openChecklistForm = (checklist: Checklist | null) =>
    setChecklistForm({ open: true, checklist })

  const handleToggle = (task: Task) => {
    try {
      actions.toggleTask(task.id)
      if (task.status === 'todo') {
        toast({
          tone: 'success',
          title: 'Tugas selesai',
          description: task.title,
          action: {
            label: 'Urungkan',
            onClick: () => {
              try {
                actions.toggleTask(task.id)
              } catch {
                // The task may have been deleted meanwhile; nothing else to do.
              }
            },
          },
        })
      } else {
        toast({ title: 'Tugas diaktifkan kembali', description: task.title })
      }
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal mengubah tugas',
        description: errorMessage(error),
      })
    }
  }

  const confirmDeleteTask = () => {
    if (!taskToDelete) return
    try {
      actions.deleteTask(taskToDelete.id)
      toast({ tone: 'success', title: 'Tugas dihapus', description: taskToDelete.title })
      setTaskToDelete(null)
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menghapus tugas', description: errorMessage(error) })
    }
  }

  const confirmDeleteChecklist = () => {
    if (!checklistToDelete) return
    try {
      actions.deleteChecklist(checklistToDelete.id)
      if (filters.checklistId === checklistToDelete.id) patchFilters({ checklistId: 'all' })
      toast({
        tone: 'success',
        title: 'Checklist dihapus',
        description: `${checklistToDelete.name} — tugasnya tetap tersimpan.`,
      })
      setChecklistToDelete(null)
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menghapus checklist', description: errorMessage(error) })
    }
  }

  const handleMonthChange = (nextMonth: string) => {
    setCalendarMonth(nextMonth)
    const today = todayISO()
    setSelectedDate(isSameMonth(today, nextMonth) ? today : `${nextMonth}-01`)
  }

  const handleChecklistSaved = (saved: Checklist) => {
    // Only jump to the new checklist when it was just created; editing keeps the
    // current task view untouched.
    if (!checklistForm.checklist) {
      patchFilters({ checklistId: saved.id })
      setTab('tasks')
    }
  }

  const checklistTaskCount = checklistToDelete
    ? data.tasks.filter((task) => task.checklistId === checklistToDelete.id).length
    : 0

  const handleSelectChecklist: (value: ChecklistFilter) => void = (value) => {
    patchFilters({ checklistId: value })
  }

  const taskWorkspace = (
    <TaskWorkspace
      tasks={data.tasks}
      checklists={data.checklists}
      checklistsById={checklistsById}
      filters={filters}
      onFiltersChange={patchFilters}
      onSelectChecklist={handleSelectChecklist}
      onAddTask={() => openCreateTask()}
      onAddChecklist={() => openChecklistForm(null)}
      onToggle={handleToggle}
      onEdit={openEditTask}
      onDelete={setTaskToDelete}
    />
  )

  const calendarPanel = (
    <MonthCalendar
      tasks={data.tasks}
      monthKey={calendarMonth}
      selectedDate={selectedDate}
      weekStartsOn={data.settings.weekStartsOn}
      onMonthChange={handleMonthChange}
      onSelectDate={setSelectedDate}
      onAddTask={(date) => openCreateTask({ date })}
    />
  )

  const agendaPanel = (
    <DayAgenda
      date={selectedDate}
      tasks={data.tasks}
      checklistsById={checklistsById}
      onAddTask={(date) => openCreateTask({ date })}
      onToggle={handleToggle}
      onEdit={openEditTask}
      onDelete={setTaskToDelete}
    />
  )

  const checklistManager = (
    <ChecklistManager
      checklists={data.checklists}
      tasks={data.tasks}
      value={filters.checklistId}
      onSelect={(value) => {
        handleSelectChecklist(value)
        setTab('tasks')
      }}
      onAdd={() => openChecklistForm(null)}
      onEdit={(checklist) => openChecklistForm(checklist)}
      onDelete={setChecklistToDelete}
    />
  )

  const tabOptions = [
    { value: 'tasks' as const, label: 'Tugas', icon: ListChecks, count: counts.open },
    { value: 'calendar' as const, label: 'Kalender', icon: CalendarDays },
    { value: 'checklists' as const, label: 'Checklist', icon: FolderKanban, count: data.checklists.length },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Planning"
        title="Rencana & tugas"
        description="Susun tugas, checklist, dan kalender dengan tenang — satu langkah kecil setiap hari."
        actions={
          <>
            <Button variant="secondary" icon={FolderPlus} onClick={() => openChecklistForm(null)}>
              Checklist baru
            </Button>
            <Button icon={Plus} onClick={() => openCreateTask()}>
              Tugas baru
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <ProgressOverview
          tasks={data.tasks}
          weekStartsOn={data.settings.weekStartsOn}
          onAddForToday={() => openCreateTask({ date: todayISO() })}
          onOpenTask={openEditTask}
        />

        {isDesktop ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,368px)] 2xl:grid-cols-[minmax(0,1fr)_400px]">
            {taskWorkspace}
            <div className="space-y-5">
              {calendarPanel}
              {agendaPanel}
              {checklistManager}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SegmentedControl<PlanningTab>
              value={tab}
              onChange={setTab}
              options={tabOptions}
              ariaLabel="Bagian Planning"
              className="w-full"
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transitions.fast}
              >
                {tab === 'tasks' ? (
                  taskWorkspace
                ) : tab === 'calendar' ? (
                  <div className="space-y-4">
                    {calendarPanel}
                    {agendaPanel}
                  </div>
                ) : (
                  checklistManager
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <TaskFormModal
        open={taskForm.open}
        onClose={closeTaskForm}
        task={taskForm.task}
        checklists={data.checklists}
        categories={categories}
        defaultDate={taskForm.defaultDate}
        defaultChecklistId={taskForm.defaultChecklistId}
      />

      <ChecklistFormModal
        open={checklistForm.open}
        onClose={() => setChecklistForm((current) => ({ ...current, open: false }))}
        checklist={checklistForm.checklist}
        taskCount={
          checklistForm.checklist
            ? data.tasks.filter((task) => task.checklistId === checklistForm.checklist?.id).length
            : 0
        }
        onSaved={handleChecklistSaved}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Hapus tugas ini?"
        description={
          <>
            Tugas <strong className="text-ink">{taskToDelete?.title}</strong> akan dihapus permanen.
            Tindakan ini tidak bisa dibatalkan.
          </>
        }
        confirmLabel="Hapus tugas"
      />

      <ConfirmDialog
        open={Boolean(checklistToDelete)}
        onClose={() => setChecklistToDelete(null)}
        onConfirm={confirmDeleteChecklist}
        title="Hapus checklist ini?"
        description={
          <>
            Checklist <strong className="text-ink">{checklistToDelete?.name}</strong> akan dihapus.
            {checklistTaskCount > 0
              ? ` ${checklistTaskCount} tugas di dalamnya tidak ikut terhapus — hanya dilepas dari checklist ini.`
              : ' Checklist ini belum punya tugas.'}
          </>
        }
        confirmLabel="Hapus checklist"
      />
    </div>
  )
}
