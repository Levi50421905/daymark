import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gauge, Plus, ReceiptText, Tags, Target } from 'lucide-react'
import { getMonthSummary } from '@/lib/calc'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { formatDateMedium, monthKeyOf, shiftMonthKey } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { actions, useAppData } from '@/lib/store'
import type { Transaction, TransactionType } from '@/types/domain'
import { AnalyticsRail } from './AnalyticsRail'
import { BudgetsTab } from './BudgetsTab'
import { CategoryManagerModal } from './CategoryManagerModal'
import { defaultTransactionDate, type FinanceTab } from './finance-utils'
import { GoalsTab } from './GoalsTab'
import { OverviewPanel } from './OverviewPanel'
import { TransactionFormModal } from './TransactionFormModal'
import { TransactionsTab } from './TransactionsTab'

interface TransactionEditorState {
  open: boolean
  transaction: Transaction | null
}

export default function FinancePage() {
  const data = useAppData()
  const toast = useToast()
  const currency = data.settings.currency
  const [month, setMonth] = useState(() => monthKeyOf())
  const [tab, setTab] = useState<FinanceTab>('transactions')
  const [transactionEditor, setTransactionEditor] = useState<TransactionEditorState>({
    open: false,
    transaction: null,
  })
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [categoryManagerType, setCategoryManagerType] = useState<TransactionType>('expense')
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null)

  const summary = useMemo(() => getMonthSummary(data, month), [data, month])
  const previous = useMemo(
    () => getMonthSummary(data, shiftMonthKey(month, -1)),
    [data, month],
  )

  const openAddTransaction = () => setTransactionEditor({ open: true, transaction: null })
  const openEditTransaction = (transaction: Transaction) =>
    setTransactionEditor({ open: true, transaction })
  const closeTransactionEditor = () =>
    setTransactionEditor({ open: false, transaction: null })

  const openCategoryManager = (type: TransactionType = 'expense') => {
    closeTransactionEditor()
    setCategoryManagerType(type)
    setCategoryManagerOpen(true)
  }

  const tabOptions: Array<SegmentedOption<FinanceTab>> = [
    { value: 'transactions', label: 'Transaksi', icon: ReceiptText, count: summary.transactionCount },
    {
      value: 'budgets',
      label: 'Anggaran',
      icon: Gauge,
      count: summary.budget.rows.filter((row) => row.budget > 0).length,
    },
    { value: 'goals', label: 'Target', icon: Target, count: data.goals.length },
  ]

  const deleteTransactionCategory = deleteTransaction
    ? data.categories.find((category) => category.id === deleteTransaction.categoryId)
    : undefined
  const deleteTransactionDescription = deleteTransaction
    ? `${deleteTransaction.note.trim() || deleteTransactionCategory?.name || 'Transaksi'} · ${formatMoney(
        deleteTransaction.amount,
        currency,
      )} pada ${formatDateMedium(deleteTransaction.date)}. Tindakan ini tidak bisa dibatalkan.`
    : ''

  const confirmDeleteTransaction = () => {
    if (!deleteTransaction) return
    try {
      actions.deleteTransaction(deleteTransaction.id)
      toast({
        tone: 'success',
        title: 'Transaksi dihapus',
        description: 'Ringkasan dan anggaran bulan ini sudah menyesuaikan.',
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menghapus transaksi',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    } finally {
      setDeleteTransaction(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Keuangan"
        description="Catat pemasukan dan pengeluaran, jaga anggaran, dan tumbuhkan target tabunganmu pelan-pelan."
        actions={
          <>
            <Button variant="secondary" icon={Tags} onClick={() => openCategoryManager()}>
              Kategori
            </Button>
            <Button icon={Plus} onClick={openAddTransaction}>
              Tambah transaksi
            </Button>
          </>
        }
      />

      <OverviewPanel
        data={data}
        month={month}
        summary={summary}
        previous={previous}
        onMonthChange={setMonth}
        onOpenBudgets={() => setTab('budgets')}
      />

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={tabOptions}
              ariaLabel="Bagian keuangan"
            />
            <p className="hidden text-[0.6875rem] font-semibold text-ink-3 sm:block">
              {summary.transactionCount} transaksi · {data.goals.length} target
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {tab === 'transactions' ? (
                <TransactionsTab
                  key={`transactions-${month}`}
                  data={data}
                  month={month}
                  summary={summary}
                  onAdd={openAddTransaction}
                  onEdit={openEditTransaction}
                  onDelete={setDeleteTransaction}
                />
              ) : null}
              {tab === 'budgets' ? (
                <BudgetsTab
                  key={`budgets-${month}`}
                  data={data}
                  month={month}
                  summary={summary}
                />
              ) : null}
              {tab === 'goals' ? (
                <GoalsTab key={`goals-${month}`} data={data} month={month} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div>
          <AnalyticsRail
            data={data}
            month={month}
            summary={summary}
            onOpenGoals={() => setTab('goals')}
          />
        </div>
      </div>

      <TransactionFormModal
        open={transactionEditor.open}
        transaction={transactionEditor.transaction}
        defaultDate={defaultTransactionDate(month)}
        categories={data.categories}
        currency={currency}
        onClose={closeTransactionEditor}
        onManageCategories={openCategoryManager}
      />

      <CategoryManagerModal
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        data={data}
        initialType={categoryManagerType}
      />

      <ConfirmDialog
        open={Boolean(deleteTransaction)}
        onClose={() => setDeleteTransaction(null)}
        onConfirm={confirmDeleteTransaction}
        title="Hapus transaksi?"
        description={deleteTransactionDescription}
        confirmLabel="Hapus transaksi"
      />
    </div>
  )
}
