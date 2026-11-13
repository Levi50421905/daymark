import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PRIORITY_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type {
  PlanningFilters,
  PriorityFilter,
  StatusFilter,
  TaskCounts,
} from '@/features/planning/planning-helpers'

interface TaskFiltersBarProps {
  filters: PlanningFilters
  counts: TaskCounts
  resultCount: number
  active: boolean
  onChange: (patch: Partial<PlanningFilters>) => void
  onClear: () => void
}

export function TaskFiltersBar({
  filters,
  counts,
  resultCount,
  active,
  onChange,
  onClear,
}: TaskFiltersBarProps) {
  const statusOptions: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: 'all', label: 'Semua', count: counts.all },
    { value: 'todo', label: 'Aktif', count: counts.open },
    { value: 'done', label: 'Selesai', count: counts.done },
  ]
  const priorityOptions: Array<{ value: PriorityFilter; label: string }> = [
    { value: 'all', label: 'Semua prioritas' },
    { value: 'high', label: `Prioritas ${PRIORITY_META.high.label.toLowerCase()}` },
    { value: 'medium', label: `Prioritas ${PRIORITY_META.medium.label.toLowerCase()}` },
    { value: 'low', label: `Prioritas ${PRIORITY_META.low.label.toLowerCase()}` },
  ]

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Cari tugas, catatan, kategori…"
          aria-label="Cari tugas"
          className={cn('field h-11 pl-9 pr-10', filters.search && 'font-medium')}
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => onChange({ search: '' })}
            aria-label="Hapus pencarian"
            className="focus-ring absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SegmentedControl
          value={filters.status}
          onChange={(value) => onChange({ status: value })}
          options={statusOptions}
          ariaLabel="Filter status tugas"
          className="w-full sm:w-auto"
        />
        <Select
          value={filters.priority}
          onChange={(event) => onChange({ priority: event.target.value as PriorityFilter })}
          aria-label="Filter prioritas tugas"
          wrapperClassName="w-full sm:w-[148px] sm:shrink-0"
          className="h-11 text-xs font-semibold"
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <p className="text-[0.6875rem] font-medium text-ink-3">
            Menampilkan <span className="number font-bold text-ink-2">{resultCount}</span> tugas setelah
            filter.
          </p>
          <Button size="sm" variant="ghost" icon={X} onClick={onClear}>
            Hapus filter
          </Button>
        </div>
      ) : null}
    </div>
  )
}
