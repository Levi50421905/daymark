import { getChecklistProgress, type ChecklistProgress } from '@/lib/calc'
import { TASK_CATEGORIES } from '@/lib/constants'
import { formatWeekdayShort, getCalendarDays, toISODate } from '@/lib/dates'
import type { Checklist, Priority, Task, WeekStart } from '@/types/domain'

/** Local view state for the Planning module. Kept inside the feature folder. */
export type PlanningTab = 'tasks' | 'calendar' | 'checklists'
export type StatusFilter = 'all' | 'todo' | 'done'
export type PriorityFilter = 'all' | Priority
/** `none` filters tasks that are not attached to any checklist. */
export type ChecklistFilter = 'all' | 'none' | string

export interface PlanningFilters {
  status: StatusFilter
  priority: PriorityFilter
  search: string
  checklistId: ChecklistFilter
}

export const DEFAULT_PLANNING_FILTERS: PlanningFilters = {
  status: 'all',
  priority: 'all',
  search: '',
  checklistId: 'all',
}

/** Icon choices for user checklists. All names exist in DynamicIcon. */
export const CHECKLIST_ICON_CHOICES = [
  'Sun',
  'CalendarCheck',
  'House',
  'HeartPulse',
  'BookOpen',
  'Briefcase',
  'ShoppingBasket',
  'Sparkles',
  'Dumbbell',
  'Target',
  'Coffee',
  'Wallet',
  'Plane',
  'PawPrint',
  'UtensilsCrossed',
  'Shapes',
] as const

const CATEGORY_COLORS: Record<string, string> = {
  Personal: '#2EC4B6',
  Rumah: '#5FA8F5',
  Kesehatan: '#EF7C9A',
  Pekerjaan: '#8B8FF7',
  Belajar: '#F4A261',
  Keuangan: '#F0B429',
  Sosial: '#57C7E8',
}

const FALLBACK_ACCENTS = ['#9AA8BC', '#57C7E8', '#8B8FF7', '#F4A261', '#3BBFA3', '#EF7C9A']

export function categoryColor(category: string): string {
  const known = CATEGORY_COLORS[category]
  if (known) return known
  let hash = 0
  for (let index = 0; index < category.length; index += 1) {
    hash = (hash + category.charCodeAt(index) * (index + 3)) % 997
  }
  return FALLBACK_ACCENTS[hash % FALLBACK_ACCENTS.length] ?? FALLBACK_ACCENTS[0]!
}

/** Categories shipped by the app plus any custom values used by existing tasks. */
export function categoryOptions(tasks: Task[]): string[] {
  const custom = [
    ...new Set(
      tasks
        .map((task) => task.category)
        .filter((value) => value && !TASK_CATEGORIES.includes(value)),
    ),
  ]
  return [...TASK_CATEGORIES, ...custom]
}

export function isFiltersActive(filters: PlanningFilters): boolean {
  return (
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.checklistId !== 'all' ||
    filters.search.trim().length > 0
  )
}

export function filterTasks(tasks: Task[], filters: PlanningFilters): Task[] {
  const query = filters.search.trim().toLowerCase()
  return tasks.filter((task) => {
    if (filters.checklistId === 'none') {
      if (task.checklistId !== null) return false
    } else if (filters.checklistId !== 'all' && task.checklistId !== filters.checklistId) {
      return false
    }
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (query) {
      const haystack = `${task.title} ${task.notes} ${task.category}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export interface TaskCounts {
  all: number
  open: number
  done: number
  overdue: number
}

export function countTasks(tasks: Task[], todayIso: string): TaskCounts {
  return {
    all: tasks.length,
    open: tasks.filter((task) => task.status === 'todo').length,
    done: tasks.filter((task) => task.status === 'done').length,
    overdue: tasks.filter(
      (task) => task.status === 'todo' && task.dueDate !== null && task.dueDate < todayIso,
    ).length,
  }
}

/** Map of checklist id → progress, using the shared calculation. */
export function checklistProgressMap(
  checklists: Checklist[],
  tasks: Task[],
): Map<string, ChecklistProgress> {
  return new Map(getChecklistProgress(checklists, tasks).map((item) => [item.checklist.id, item]))
}

/** Map of ISO date → tasks due that day (open first, then by priority). */
export function buildTaskDateMap(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.dueDate) continue
    const bucket = map.get(task.dueDate)
    if (bucket) bucket.push(task)
    else map.set(task.dueDate, [task])
  }
  for (const bucket of map.values()) {
    bucket.sort((left, right) => {
      if (left.status !== right.status) return left.status === 'done' ? 1 : -1
      const rank = { high: 0, medium: 1, low: 2 }
      return rank[left.priority] - rank[right.priority]
    })
  }
  return map
}

export function weekdayHeaders(monthKey: string, weekStartsOn: WeekStart): string[] {
  return getCalendarDays(monthKey, weekStartsOn)
    .slice(0, 7)
    .map((date) => formatWeekdayShort(toISODate(date)))
}
