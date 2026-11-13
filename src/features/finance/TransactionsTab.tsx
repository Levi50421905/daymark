import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Plus, ReceiptText, RotateCcw, Search, SearchX, Trash2, X } from 'lucide-react'
import { summarizeTransactions, transactionsInRange, type MonthSummary } from '@/lib/calc'
import { SectionHeading } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Button, IconButton } from '@/components/ui/Button'
import { DateInput, Field, Select, TextInput } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { formatMonthLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { fadeUp, listItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { AppData, Category, CurrencyCode, Transaction, TransactionType } from '@/types/domain'
import {
  compactMoney,
  dateGroupHeading,
  dateGroupSubLabel,
  groupTransactionsByDate,
  transactionDisplayTitle,
  transactionMatchesQuery,
  transactionSourceLabel,
} from './finance-utils'

type TypeFilter = 'all' | TransactionType

function clampToMonth(value: string, start: string, end: string): string {
  if (!value) return ''
  if (value < start) return start
  if (value > end) return end
  return value
}

interface TransactionsTabProps {
  data: AppData
  month: string
  summary: MonthSummary
  onAdd: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

export function TransactionsTab({
  data,
  month,
  summary,
  onAdd,
  onEdit,
  onDelete,
}: TransactionsTabProps) {
  const currency = data.settings.currency
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const categoryMap = useMemo(
    () => new Map(data.categories.map((category) => [category.id, category])),
    [data.categories],
  )
  const monthTransactions = useMemo(
    () => transactionsInRange(data, summary.range),
    [data, summary.range],
  )
  const incomeCount = monthTransactions.filter((item) => item.type === 'income').length
  const expenseCount = monthTransactions.length - incomeCount

  const categoryOptions = useMemo(
    () =>
      data.categories
        .filter((category) => typeFilter === 'all' || category.type === typeFilter)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.categories, typeFilter],
  )

  const hasFilters =
    search.trim() !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== ''

  const filtered = useMemo(() => {
    const start = fromDate || summary.range.start
    const end = toDate || summary.range.end
    return data.transactions.filter((transaction) => {
      if (transaction.date < start || transaction.date > end) return false
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false
      if (categoryFilter !== 'all' && transaction.categoryId !== categoryFilter) return false
      const categoryName = categoryMap.get(transaction.categoryId)?.name ?? ''
      return transactionMatchesQuery(transaction, categoryName, search)
    })
  }, [
    categoryFilter,
    categoryMap,
    data.transactions,
    fromDate,
    search,
    summary.range.end,
    summary.range.start,
    toDate,
    typeFilter,
  ])

  const filteredTotals = useMemo(() => summarizeTransactions(filtered), [filtered])
  const groups = useMemo(() => groupTransactionsByDate(filtered), [filtered])

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setFromDate('')
    setToDate('')
  }

  const handleFromChange = (value: string) => {
    const next = clampToMonth(value, summary.range.start, summary.range.end)
    setFromDate(next)
    if (next && toDate && next > toDate) setToDate(next)
  }

  const handleToChange = (value: string) => {
    const next = clampToMonth(value, summary.range.start, summary.range.end)
    setToDate(next)
    if (next && fromDate && next < fromDate) setFromDate(next)
  }

  const handleTypeFilterChange = (value: TypeFilter) => {
    setTypeFilter(value)
    if (categoryFilter === 'all') return
    const category = categoryMap.get(categoryFilter)
    if (!category || (value !== 'all' && category.type !== value)) {
      setCategoryFilter('all')
    }
  }

  return (
    <div className="surface-card p-4 sm:p-5">
      <SectionHeading
        title="Daftar transaksi"
        description={`${monthTransactions.length} transaksi tercatat di ${formatMonthLabel(month)}.`}
        action={
          <Button size="sm" variant="soft" icon={Plus} onClick={onAdd}>
            Tambah
          </Button>
        }
      />

      <div className="surface-muted mt-4 space-y-2.5 p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            aria-hidden="true"
          />
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari catatan, kategori, atau nominal…"
            aria-label="Cari transaksi"
            className="pl-10 pr-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Bersihkan pencarian"
              className="focus-ring absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SegmentedControl
            value={typeFilter}
            onChange={handleTypeFilterChange}
            size="sm"
            ariaLabel="Filter jenis transaksi"
            options={[
              { value: 'all', label: 'Semua', count: monthTransactions.length },
              { value: 'income', label: 'Masuk', count: incomeCount },
              { value: 'expense', label: 'Keluar', count: expenseCount },
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter kategori"
            wrapperClassName="sm:ml-auto sm:w-[200px]"
            className="h-9 rounded-xl text-xs"
          >
            <option value="all">Semua kategori</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <Field label="Dari tanggal" htmlFor="finance-filter-from">
            <DateInput
              id="finance-filter-from"
              value={fromDate}
              min={summary.range.start}
              max={toDate || summary.range.end}
              onValueChange={handleFromChange}
              className="h-10 rounded-xl text-xs"
            />
          </Field>
          <Field label="Sampai tanggal" htmlFor="finance-filter-to">
            <DateInput
              id="finance-filter-to"
              value={toDate}
              min={fromDate || summary.range.start}
              max={summary.range.end}
              onValueChange={handleToChange}
              className="h-10 rounded-xl text-xs"
            />
          </Field>
          {hasFilters ? (
            <Button
              variant="ghost"
              icon={RotateCcw}
              onClick={resetFilters}
              className="col-span-2 h-9 justify-self-start px-2.5 text-[0.6875rem] sm:col-span-1 sm:mb-0.5"
            >
              Reset filter
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.6875rem] font-semibold text-ink-3">
          {filtered.length} transaksi{hasFilters ? ` dari ${monthTransactions.length}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-mint/25 bg-mint/10 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-600 dark:text-mint">
            Masuk {compactMoney(filteredTotals.income, currency)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-peach/25 bg-peach/15 px-2 py-0.5 text-[0.625rem] font-bold text-orange-600 dark:text-peach">
            Keluar {compactMoney(filteredTotals.expense, currency)}
          </span>
        </div>
      </div>

      {monthTransactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada transaksi bulan ini"
          description="Mulai dari catatan kecil: kopi pagi, bensin, atau gaji bulan ini. Ringkasan akan langsung menyesuaikan."
          action={
            <Button icon={Plus} onClick={onAdd}>
              Tambah transaksi
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          compact
          icon={SearchX}
          title="Tidak ada transaksi yang cocok"
          description="Coba kata kunci lain, perluas rentang tanggal, atau reset filter."
          action={
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={resetFilters}>
              Reset filter
            </Button>
          }
        />
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <motion.section
              key={group.date}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-1.5 flex items-end justify-between gap-2 px-1">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold tracking-[-0.01em] text-ink-2">
                    {dateGroupHeading(group.date)}
                  </h3>
                  {dateGroupSubLabel(group.date) ? (
                    <p className="text-[0.625rem] font-medium text-ink-3">
                      {dateGroupSubLabel(group.date)}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-[0.625rem] font-semibold text-ink-3">
                  {group.transactions.length} transaksi
                  <span
                    className={cn(
                      'number ml-1.5 font-bold',
                      group.income - group.expense >= 0 ? 'text-success' : 'text-ink-2',
                    )}
                  >
                    {formatMoney(group.income - group.expense, currency, {
                      signed: group.income - group.expense !== 0,
                      compact: true,
                    })}
                  </span>
                </p>
              </div>
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {group.transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      category={categoryMap.get(transaction.categoryId)}
                      currency={currency}
                      onEdit={() => onEdit(transaction)}
                      onDelete={() => onDelete(transaction)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  )
}

interface TransactionRowProps {
  transaction: Transaction
  category: Category | undefined
  currency: CurrencyCode
  onEdit: () => void
  onDelete: () => void
}

function TransactionRow({ transaction, category, currency, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = transaction.type === 'income'
  const title = transactionDisplayTitle(transaction, category)
  const source = transactionSourceLabel(transaction)
  return (
    <motion.li
      layout
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="surface-muted flex items-center gap-1.5 p-1.5 pl-2 transition-colors hover:border-line-strong"
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Ubah transaksi ${title}`}
        className="focus-ring flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 text-left"
      >
        <CategoryIcon
          icon={category?.icon ?? 'Shapes'}
          color={category?.color ?? '#9AA8BC'}
          size="sm"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-semibold text-ink">{title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-3">
            <span className="truncate">{category?.name ?? 'Tanpa kategori'}</span>
            {source ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{source}</span>
              </>
            ) : null}
          </span>
        </span>
        <span
          className={cn(
            'number shrink-0 text-xs font-extrabold sm:text-[0.8125rem]',
            isIncome ? 'text-success' : 'text-ink',
          )}
        >
          {formatMoney(isIncome ? transaction.amount : -transaction.amount, currency, { signed: true })}
        </span>
      </button>
      <IconButton
        label={`Ubah transaksi ${title}`}
        icon={Pencil}
        size="sm"
        className="hidden sm:inline-flex"
        onClick={onEdit}
      />
      <IconButton
        label={`Hapus transaksi ${title}`}
        icon={Trash2}
        size="md"
        variant="danger"
        onClick={onDelete}
      />
    </motion.li>
  )
}
