import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { History, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { getSavingsOverview, type GoalProgress } from '@/lib/calc'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { CircularProgress } from '@/components/charts/DonutChart'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { getMonthRange } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { actions } from '@/lib/store'
import { sum } from '@/lib/utils'
import type { AppData, CurrencyCode, GoalContribution, SavingsGoal } from '@/types/domain'
import { ContributionFormModal } from './ContributionFormModal'
import { GoalDetailModal } from './GoalDetailModal'
import { GoalFormModal } from './GoalFormModal'
import { goalDeadlineMeta, sortContributions } from './finance-utils'

interface GoalsTabProps {
  data: AppData
  month: string
}

export function GoalsTab({ data, month }: GoalsTabProps) {
  const toast = useToast()
  const currency = data.settings.currency
  const overview = useMemo(() => getSavingsOverview(data), [data])
  const monthRange = useMemo(() => getMonthRange(month), [month])
  const monthContributionTotal = useMemo(
    () =>
      sum(
        data.contributions
          .filter((item) => item.date >= monthRange.start && item.date <= monthRange.end)
          .map((item) => item.amount),
      ),
    [data.contributions, monthRange],
  )

  const [goalEditor, setGoalEditor] = useState<{ open: boolean; goal: SavingsGoal | null }>({
    open: false,
    goal: null,
  })
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null)

  const detailProgress: GoalProgress | null = detailGoalId
    ? (overview.goals.find((item) => item.goal.id === detailGoalId) ?? null)
    : null
  const detailContributions = useMemo(
    () =>
      detailGoalId
        ? sortContributions(data.contributions.filter((item) => item.goalId === detailGoalId))
        : [],
    [data.contributions, detailGoalId],
  )
  const contributionGoal = contributionGoalId
    ? (data.goals.find((goal) => goal.id === contributionGoalId) ?? null)
    : null
  const contributionProgress = contributionGoalId
    ? (overview.goals.find((item) => item.goal.id === contributionGoalId) ?? null)
    : null
  const deleteTargetProgress = deleteTarget
    ? (overview.goals.find((item) => item.goal.id === deleteTarget.id) ?? null)
    : null

  const openCreate = () => setGoalEditor({ open: true, goal: null })
  const openEdit = (goal: SavingsGoal) => setGoalEditor({ open: true, goal })
  const openContribution = (goal: SavingsGoal) => setContributionGoalId(goal.id)

  const handleDeleteContribution = (contribution: GoalContribution) => {
    try {
      actions.deleteContribution(contribution.id)
      toast({
        tone: 'success',
        title: 'Setoran dihapus',
        description: formatMoney(contribution.amount, currency),
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menghapus setoran',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    }
  }

  const confirmDeleteGoal = () => {
    if (!deleteTarget) return
    try {
      actions.deleteGoal(deleteTarget.id)
      if (detailGoalId === deleteTarget.id) setDetailGoalId(null)
      if (contributionGoalId === deleteTarget.id) setContributionGoalId(null)
      toast({
        tone: 'success',
        title: 'Target dihapus',
        description: `${deleteTarget.name} beserta riwayat setorannya sudah dihapus.`,
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menghapus target',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <CircularProgress
              value={overview.progress}
              size={82}
              strokeWidth={8}
              color="var(--c-brand)"
              ariaLabel={`Progres seluruh target tabungan: ${Math.round(overview.progress)}%`}
            >
              <span className="number text-sm font-extrabold tracking-tight text-ink">
                {Math.round(overview.progress)}%
              </span>
            </CircularProgress>
            <div className="min-w-0">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                Total tabungan
              </p>
              <p className="mt-1 truncate text-lg font-extrabold tracking-[-0.03em] text-ink">
                <MoneyText amount={overview.totalSaved} currency={currency} animated />
              </p>
              <p className="mt-0.5 text-[0.6875rem] font-medium text-ink-3">
                dari target {formatMoney(overview.totalTarget, currency)} · {data.goals.length}{' '}
                target
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-[0.6875rem] font-semibold text-ink-3">
              {monthContributionTotal > 0
                ? `+ ${formatMoney(monthContributionTotal, currency)} bulan ini`
                : 'Belum ada setoran bulan ini'}
            </p>
            <Button icon={Plus} onClick={openCreate}>
              Buat target
            </Button>
          </div>
        </div>
      </div>

      {overview.goals.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Target}
            title="Belum ada target tabungan"
            description="Mulai dari satu tujuan yang paling kamu inginkan. Target kecil pun terasa berarti saat progresnya bertambah."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Buat target pertama
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.goals.map((item) => (
            <GoalCard
              key={item.goal.id}
              item={item}
              currency={currency}
              onEdit={() => openEdit(item.goal)}
              onDelete={() => setDeleteTarget(item.goal)}
              onAddContribution={() => openContribution(item.goal)}
              onOpenDetail={() => setDetailGoalId(item.goal.id)}
            />
          ))}
        </div>
      )}

      <GoalFormModal
        open={goalEditor.open}
        goal={goalEditor.goal}
        currency={currency}
        onClose={() => setGoalEditor({ open: false, goal: null })}
      />

      <GoalDetailModal
        open={Boolean(detailGoalId)}
        goal={detailProgress?.goal ?? null}
        progress={detailProgress}
        contributions={detailContributions}
        currency={currency}
        onClose={() => setDetailGoalId(null)}
        onAddContribution={() => {
          if (detailProgress) openContribution(detailProgress.goal)
        }}
        onDeleteContribution={handleDeleteContribution}
      />

      <ContributionFormModal
        open={Boolean(contributionGoal)}
        goal={contributionGoal}
        saved={contributionProgress?.saved ?? 0}
        currency={currency}
        onClose={() => setContributionGoalId(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteGoal}
        title={`Hapus target “${deleteTarget?.name ?? ''}”?`}
        description={
          deleteTarget
            ? `${deleteTargetProgress?.contributionCount ?? 0} setoran senilai ${formatMoney(
                deleteTargetProgress?.saved ?? 0,
                currency,
              )} ikut terhapus. Transaksi keuanganmu tidak terpengaruh.`
            : ''
        }
        confirmLabel="Hapus target"
      />
    </div>
  )
}

interface GoalCardProps {
  item: GoalProgress
  currency: CurrencyCode
  onEdit: () => void
  onDelete: () => void
  onAddContribution: () => void
  onOpenDetail: () => void
}

function GoalCard({
  item,
  currency,
  onEdit,
  onDelete,
  onAddContribution,
  onOpenDetail,
}: GoalCardProps) {
  const deadline = goalDeadlineMeta(item.goal.deadline)
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" layout>
      <div className="surface-card flex h-full flex-col p-4 transition-colors hover:border-line-strong">
        <div className="flex items-start gap-3">
          <CircularProgress
            value={item.progress}
            size={58}
            strokeWidth={6}
            color={item.goal.color}
            ariaLabel={`Progres ${item.goal.name}: ${Math.round(item.progress)}%`}
          >
            <span className="number text-[0.625rem] font-extrabold text-ink">
              {Math.round(item.progress)}%
            </span>
          </CircularProgress>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-[-0.01em] text-ink">
                  {item.goal.name}
                </p>
                <p className="mt-1">
                  <Badge tone={deadline.tone}>{deadline.label}</Badge>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton
                  label={`Ubah target ${item.goal.name}`}
                  icon={Pencil}
                  size="sm"
                  onClick={onEdit}
                />
                <IconButton
                  label={`Hapus target ${item.goal.name}`}
                  icon={Trash2}
                  size="sm"
                  variant="danger"
                  onClick={onDelete}
                />
              </div>
            </div>
            <p className="mt-2 truncate text-[0.8125rem] font-extrabold text-ink">
              <MoneyText amount={item.saved} currency={currency} />
              <span className="ml-1 text-[0.6875rem] font-medium text-ink-3">
                / {formatMoney(item.goal.targetAmount, currency)}
              </span>
            </p>
          </div>
        </div>

        <ProgressBar value={item.progress} color={item.goal.color} height="xs" className="mt-3" />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="text-[0.625rem] font-medium text-ink-3">
            {item.contributionCount} setoran · sisa {formatMoney(item.remaining, currency)}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="ghost" icon={History} onClick={onOpenDetail}>
              Riwayat
            </Button>
            <Button size="sm" variant="soft" icon={Plus} onClick={onAddContribution}>
              Tambah dana
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
