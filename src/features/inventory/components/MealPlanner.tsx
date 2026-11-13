import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarPlus,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Copy,
  ListChecks,
  Plus,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { CountUp } from '@/components/ui/CountUp'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { MEAL_META } from '@/lib/constants'
import type { MealWeekSummary } from '@/lib/calc'
import {
  addDaysISO,
  enumerateDates,
  formatDate,
  formatDateMedium,
  formatDateRange,
  formatDay,
  formatWeekdayShort,
  getWeekRange,
  isToday,
  todayISO,
  type DateRange,
} from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type {
  CurrencyCode,
  InventoryItem,
  MealPlan,
  MealType,
  WeekStart,
} from '@/types/domain'
import { MealIngredientsCard, MealSuggestionsCard } from './MealAside'
import {
  mealIngredientCount,
  mealSuggestionItems,
  mealsInWeek,
  weekRelativeLabel,
  MEAL_ORDER,
} from '../lib/meals'

interface MealPlannerProps {
  mealPlans: MealPlan[]
  inventory: InventoryItem[]
  currency: CurrencyCode
  weekStartsOn: WeekStart
  weekRange: DateRange
  summary: MealWeekSummary
  onWeekAnchorChange: (anchor: string) => void
  onAddMeal: (date: string, meal: MealType) => void
  onAddAnyMeal: () => void
  onEditMeal: (meal: MealPlan) => void
  onCopyPreviousWeek: () => void
  onAddWithIngredient: (item: InventoryItem) => void
  onGoToStock: () => void
}

export function MealPlanner({
  mealPlans,
  inventory,
  currency,
  weekStartsOn,
  weekRange,
  summary,
  onWeekAnchorChange,
  onAddMeal,
  onAddAnyMeal,
  onEditMeal,
  onCopyPreviousWeek,
  onAddWithIngredient,
  onGoToStock,
}: MealPlannerProps) {
  const today = todayISO()
  const days = enumerateDates(weekRange.start, weekRange.end)
  const isCurrentWeek = weekRange.start === getWeekRange(today, weekStartsOn).start
  const relative = weekRelativeLabel(weekRange.start, weekStartsOn)
  const daysCovered = days.filter((day) => (summary.byDay[day]?.length ?? 0) > 0).length
  const previousRange = getWeekRange(addDaysISO(weekRange.start, -7), weekStartsOn)
  const previousWeekMeals = mealsInWeek(mealPlans, previousRange)
  const suggestions = mealSuggestionItems(inventory, today)
  const averageCost = summary.mealCount > 0 ? Math.round(summary.totalCost / summary.mealCount) : 0

  const shiftWeek = (direction: -1 | 1) => {
    onWeekAnchorChange(addDaysISO(weekRange.start, direction * 7))
  }

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <div className="hero-gradient p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <IconButton
                label="Minggu sebelumnya"
                icon={ChevronLeft}
                variant="secondary"
                onClick={() => shiftWeek(-1)}
              />
              <div className="min-w-0 px-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="text-[0.9rem] font-extrabold tracking-[-0.02em] text-ink sm:text-base">
                    {formatDateRange(weekRange.start, weekRange.end)}
                  </h2>
                  {relative ? <Badge tone="brand">{relative}</Badge> : null}
                </div>
                <p className="mt-0.5 text-[10px] text-ink-3 sm:text-[11px]">
                  {weekStartsOn === 'monday' ? 'Minggu dimulai Senin' : 'Minggu dimulai Minggu'} ·{' '}
                  {summary.mealCount} menu direncanakan
                </p>
              </div>
              <IconButton
                label="Minggu berikutnya"
                icon={ChevronRight}
                variant="secondary"
                onClick={() => shiftWeek(1)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isCurrentWeek ? (
                <Button size="sm" variant="secondary" onClick={() => onWeekAnchorChange(today)}>
                  Minggu ini
                </Button>
              ) : null}
              <Button size="sm" variant="outline" icon={Plus} onClick={onAddAnyMeal}>
                Tambah menu
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <WeekStat
              icon={Wallet}
              label="Estimasi biaya"
              value={
                <>
                  <span className="sm:hidden">
                    <MoneyText
                      amount={summary.totalCost}
                      currency={currency}
                      compact
                      animated
                      className="text-[13px] font-extrabold text-ink"
                    />
                  </span>
                  <span className="hidden sm:inline">
                    <MoneyText
                      amount={summary.totalCost}
                      currency={currency}
                      animated
                      className="text-[1.05rem] font-extrabold text-ink"
                    />
                  </span>
                </>
              }
              hint={
                summary.mealCount > 0
                  ? `${formatMoney(averageCost, currency, { compact: true })} per menu`
                  : 'Belum ada menu'
              }
            />
            <WeekStat
              icon={ChefHat}
              label="Jumlah menu"
              value={
                <span className="text-[13px] font-extrabold text-ink number sm:text-[1.05rem]">
                  <CountUp value={summary.mealCount} />
                </span>
              }
              hint={`${daysCovered}/7 hari terisi`}
            />
            <WeekStat
              icon={ListChecks}
              label="Bahan unik"
              value={
                <span className="text-[13px] font-extrabold text-ink number sm:text-[1.05rem]">
                  <CountUp value={summary.ingredients.length} />
                </span>
              }
              hint="Gabungan semua menu"
            />
          </div>
        </div>
      </Card>

      {summary.mealCount === 0 ? (
        <Card padding="md" className="border-dashed">
          <EmptyState
            compact
            icon={CalendarPlus}
            title={relative ? `${relative} belum ada menu` : 'Belum ada menu minggu ini'}
            description={
              previousWeekMeals.length > 0
                ? 'Salin rencana minggu lalu, lalu sesuaikan dengan stok dan jadwal minggu ini.'
                : 'Mulai dari satu menu sederhana — sarapan atau makan malam. Kamu bisa menambah bahan dari stok dapur.'
            }
            action={
              <Button size="sm" icon={Plus} onClick={onAddAnyMeal}>
                Tambah menu
              </Button>
            }
            secondaryAction={
              previousWeekMeals.length > 0 ? (
                <Button size="sm" variant="secondary" icon={Copy} onClick={onCopyPreviousWeek}>
                  Salin minggu lalu ({previousWeekMeals.length})
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <Card padding="md" className="xl:col-start-1 xl:row-start-1">
          <SectionHeading
            title="Rencana mingguan"
            description="Ketuk slot untuk mengisi atau mengubah menu."
            action={<Badge tone="neutral">{summary.mealCount} menu</Badge>}
          />
          <motion.div
            key={weekRange.start}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.fast}
            className="mt-2"
          >
            {days.map((day) => {
              const dayMeals = summary.byDay[day] ?? []
              const todayFlag = isToday(day)
              return (
                <div
                  key={day}
                  className={cn(
                    'grid grid-cols-[44px_minmax(0,1fr)] gap-2 border-b border-line/70 py-2.5 last:border-0 sm:grid-cols-[104px_minmax(0,1fr)]',
                    todayFlag && 'rounded-xl border-transparent bg-brand/[0.04] px-1.5 ring-1 ring-brand/15 sm:px-2',
                  )}
                >
                  <div className="flex flex-col justify-center">
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-bold leading-tight sm:text-[11px]',
                        todayFlag ? 'text-brand' : 'text-ink',
                      )}
                    >
                      <span className="sm:hidden">{formatWeekdayShort(day)}</span>
                      <span className="hidden sm:inline">{formatDate(day, 'EEEE')}</span>
                      {todayFlag ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                      ) : null}
                      {todayFlag ? <span className="sr-only">Hari ini</span> : null}
                    </span>
                    <span className="mt-0.5 text-[9px] text-ink-3 sm:text-[10px]">
                      {formatDay(day)} {formatDate(day, 'MMM')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {MEAL_ORDER.map((mealType) => {
                      const slotMeals = dayMeals.filter((entry) => entry.meal === mealType)
                      if (slotMeals.length === 0) {
                        return (
                          <EmptyMealSlot
                            key={mealType}
                            day={day}
                            meal={mealType}
                            onAdd={onAddMeal}
                          />
                        )
                      }
                      return (
                        <div key={mealType} className="flex min-w-0 flex-col gap-1">
                          {slotMeals.map((meal) => (
                            <MealSlot
                              key={meal.id}
                              meal={meal}
                              currency={currency}
                              onEdit={onEditMeal}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </Card>

        <div className="space-y-4 xl:col-start-2 xl:row-start-1">
          <MealIngredientsCard
            ingredients={summary.ingredients}
            mealCount={summary.mealCount}
            onGoToStock={onGoToStock}
          />
          <MealSuggestionsCard
            items={suggestions}
            today={today}
            onAddWithIngredient={onAddWithIngredient}
          />
        </div>
      </div>
    </div>
  )
}

function WeekStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint: string
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-line/70 bg-surface/75 p-2.5 backdrop-blur-sm sm:p-3">
      <p className="flex min-w-0 items-center gap-1 truncate text-[9px] font-bold uppercase tracking-[0.1em] text-ink-3">
        <Icon size={11} strokeWidth={2.1} aria-hidden="true" />
        {label}
      </p>
      <div className="mt-1 min-w-0 truncate">{value}</div>
      <p className="mt-0.5 truncate text-[9px] text-ink-3 sm:text-[10px]">{hint}</p>
    </div>
  )
}

function MealSlot({
  meal,
  currency,
  onEdit,
}: {
  meal: MealPlan
  currency: CurrencyCode
  onEdit: (meal: MealPlan) => void
}) {
  const meta = MEAL_META[meal.meal]
  const ingredientCount = mealIngredientCount(meal)
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={transitions.springSnappy}
      onClick={() => onEdit(meal)}
      className="focus-ring group flex h-full min-h-[76px] w-full flex-col rounded-xl border border-line bg-surface-2 p-2 text-left transition-colors hover:border-brand/40 hover:bg-surface-3/70"
    >
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em] text-ink-3">
        <DynamicIcon name={meta.icon} size={10} strokeWidth={2.2} aria-hidden="true" />
        {meta.shortLabel}
      </span>
      <span className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-snug text-ink">
        {meal.title}
      </span>
      <span className="mt-auto flex w-full items-end justify-between gap-1 pt-1">
        <span className="text-[10px] font-semibold text-ink-2 number">
          {meal.estimatedCost > 0
            ? formatMoney(meal.estimatedCost, currency, { compact: true })
            : 'Tanpa biaya'}
        </span>
        <span className="text-[9px] font-medium text-ink-3">{ingredientCount} bahan</span>
      </span>
      {meal.note ? (
        <span className="mt-0.5 line-clamp-1 text-[9px] italic text-ink-3">{meal.note}</span>
      ) : null}
    </motion.button>
  )
}

function EmptyMealSlot({
  day,
  meal,
  onAdd,
}: {
  day: string
  meal: MealType
  onAdd: (date: string, meal: MealType) => void
}) {
  const meta = MEAL_META[meal]
  return (
    <button
      type="button"
      onClick={() => onAdd(day, meal)}
      aria-label={`Tambah ${meta.label} untuk ${formatDateMedium(day)}`}
      className="focus-ring group flex min-h-[76px] w-full flex-col items-start justify-center rounded-xl border border-dashed border-line-strong bg-transparent p-2 text-left transition-colors hover:border-brand/50 hover:bg-brand/5"
    >
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em] text-ink-3">
        <DynamicIcon name={meta.icon} size={10} strokeWidth={2.2} aria-hidden="true" />
        {meta.shortLabel}
      </span>
      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand">
        <Plus size={11} strokeWidth={2.6} aria-hidden="true" />
        Tambah
      </span>
    </button>
  )
}
