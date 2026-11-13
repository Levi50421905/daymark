import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { PRIORITY_META } from '@/lib/constants'
import {
  formatDateLong,
  formatDateMedium,
  formatMonthLabel,
  getCalendarDays,
  isSameMonth,
  monthKeyOf,
  shiftMonthKey,
  todayISO,
  toISODate,
} from '@/lib/dates'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { buildTaskDateMap, weekdayHeaders } from '@/features/planning/planning-helpers'
import type { Task, WeekStart } from '@/types/domain'

interface MonthCalendarProps {
  tasks: Task[]
  monthKey: string
  selectedDate: string
  weekStartsOn: WeekStart
  onMonthChange: (monthKey: string) => void
  onSelectDate: (date: string) => void
  onAddTask: (date: string) => void
}

export function MonthCalendar({
  tasks,
  monthKey,
  selectedDate,
  weekStartsOn,
  onMonthChange,
  onSelectDate,
  onAddTask,
}: MonthCalendarProps) {
  const today = todayISO()
  const days = getCalendarDays(monthKey, weekStartsOn)
  const headers = weekdayHeaders(monthKey, weekStartsOn)
  const dateMap = buildTaskDateMap(tasks)

  const monthTasks = tasks.filter((task) => task.dueDate && isSameMonth(task.dueDate, monthKey))
  const monthDone = monthTasks.filter((task) => task.status === 'done').length

  const gotoMonth = (amount: number) => {
    onMonthChange(shiftMonthKey(monthKey, amount))
  }

  const handleGoToday = () => {
    onSelectDate(today)
    onMonthChange(monthKeyOf(today))
  }

  return (
    <Card padding="md" className="relative overflow-hidden">
      <SectionHeading
        title="Kalender"
        description={`${formatMonthLabel(monthKey)} · ${monthDone}/${monthTasks.length} selesai`}
        action={
          <div className="flex items-center gap-1">
            <IconButton
              label="Bulan sebelumnya"
              icon={ChevronLeft}
              size="sm"
              onClick={() => gotoMonth(-1)}
            />
            <IconButton
              label="Bulan berikutnya"
              icon={ChevronRight}
              size="sm"
              onClick={() => gotoMonth(1)}
            />
          </div>
        }
      />

      <div className="mt-4 grid grid-cols-7 gap-1" role="group" aria-label={`Kalender ${formatMonthLabel(monthKey)}`}>
        {headers.map((header) => (
          <div
            key={header}
            className="pb-1 text-center text-[0.625rem] font-bold uppercase tracking-[0.08em] text-ink-3"
          >
            {header}
          </div>
        ))}
        {days.map((date) => {
          const iso = toISODate(date)
          const dayTasks = dateMap.get(iso) ?? []
          const openTasks = dayTasks.filter((task) => task.status === 'todo')
          const inMonth = isSameMonth(iso, monthKey)
          const selected = iso === selectedDate
          const isTodayDate = iso === today
          return (
            <motion.button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              aria-label={`${formatDateLong(iso)}${
                dayTasks.length > 0 ? `, ${dayTasks.length} tugas` : ', tidak ada tugas'
              }`}
              aria-pressed={selected}
              whileTap={{ scale: 0.94 }}
              transition={transitions.springSnappy}
              className={cn(
                'relative flex h-11 flex-col items-center justify-center rounded-[11px] border transition-colors duration-150',
                selected
                  ? 'border-brand/45 bg-brand/10'
                  : 'border-transparent hover:border-line hover:bg-surface-2',
                !inMonth && 'opacity-45',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  isTodayDate
                    ? 'bg-brand text-white shadow-[0_4px_12px_-6px_rgba(15,169,184,0.8)]'
                    : selected
                      ? 'font-extrabold text-brand'
                      : 'text-ink-2',
                )}
              >
                {date.getDate()}
              </span>
              <span className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-[2.5px]">
                {openTasks.length === 0 && dayTasks.length > 0 ? (
                  <span className="h-[3.5px] w-[3.5px] rounded-full bg-success" aria-hidden="true" />
                ) : (
                  openTasks.slice(0, 3).map((task) => (
                    <span
                      key={task.id}
                      className="h-[3.5px] w-[3.5px] rounded-full"
                      style={{ backgroundColor: PRIORITY_META[task.priority].color }}
                      aria-hidden="true"
                    />
                  ))
                )}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <Button size="sm" variant="ghost" icon={CalendarDays} onClick={handleGoToday}>
          Hari ini
        </Button>
        <div className="flex items-center gap-2">
          <p className="text-[0.6875rem] font-semibold text-ink-3">
            {formatDateMedium(selectedDate)} ·{' '}
            {(dateMap.get(selectedDate) ?? []).length > 0
              ? `${(dateMap.get(selectedDate) ?? []).length} tugas`
              : 'kosong'}
          </p>
          <IconButton
            label="Tambah tugas pada tanggal terpilih"
            icon={Plus}
            size="sm"
            variant="soft"
            onClick={() => onAddTask(selectedDate)}
          />
        </div>
      </div>
    </Card>
  )
}
