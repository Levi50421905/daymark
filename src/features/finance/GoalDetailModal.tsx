import { useEffect, useState } from 'react'
import { CalendarDays, PiggyBank, Plus, Trash2 } from 'lucide-react'
import type { GoalProgress } from '@/lib/calc'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/Card'
import { CircularProgress } from '@/components/charts/DonutChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { MoneyText } from '@/components/ui/MoneyText'
import { formatDateMedium } from '@/lib/dates'
import { formatMoney, formatPercent } from '@/lib/format'
import type { CurrencyCode, GoalContribution, SavingsGoal } from '@/types/domain'
import { goalDeadlineMeta } from './finance-utils'

interface GoalDetailModalProps {
  open: boolean
  goal: SavingsGoal | null
  progress: GoalProgress | null
  contributions: GoalContribution[]
  currency: CurrencyCode
  onClose: () => void
  onAddContribution: () => void
  onDeleteContribution: (contribution: GoalContribution) => void
}

export function GoalDetailModal({
  open,
  goal,
  progress,
  contributions,
  currency,
  onClose,
  onAddContribution,
  onDeleteContribution,
}: GoalDetailModalProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (open) setConfirmId(null)
  }, [open, goal])

  const deadline = goalDeadlineMeta(goal?.deadline ?? null)

  return (
    <Modal
      open={open && Boolean(goal) && Boolean(progress)}
      onClose={onClose}
      size="lg"
      title={goal?.name ?? 'Target tabungan'}
      description={goal?.note.trim() ? goal.note : 'Riwayat setoran dan progres target ini.'}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button icon={Plus} onClick={onAddContribution}>
            Tambah dana
          </Button>
        </ModalFooter>
      }
    >
      {goal && progress ? (
        <div className="space-y-4">
          <div className="surface-muted flex items-center gap-3.5 p-3.5">
            <CircularProgress
              value={progress.progress}
              size={78}
              strokeWidth={8}
              color={goal.color}
              ariaLabel={`Progres ${goal.name}: ${formatPercent(progress.progress)}`}
            >
              <span className="number text-xs font-extrabold text-ink">
                {Math.round(progress.progress)}%
              </span>
            </CircularProgress>
            <div className="min-w-0 flex-1">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                Terkumpul
              </p>
              <p className="mt-0.5 truncate text-base font-extrabold tracking-[-0.02em] text-ink">
                <MoneyText amount={progress.saved} currency={currency} />
              </p>
              <p className="mt-0.5 text-[0.6875rem] font-medium text-ink-3">
                dari {formatMoney(goal.targetAmount, currency)} · sisa{' '}
                {formatMoney(progress.remaining, currency)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={deadline.tone}>{deadline.label}</Badge>
            <Badge tone="neutral">{progress.contributionCount} setoran</Badge>
            {progress.lastContributionDate ? (
              <Badge tone="neutral">
                Terakhir {formatDateMedium(progress.lastContributionDate)}
              </Badge>
            ) : null}
            {progress.progress >= 100 ? <Badge tone="success">Tercapai</Badge> : null}
          </div>

          <div>
            <SectionHeading
              title="Riwayat setoran"
              description={`${contributions.length} setoran tercatat untuk target ini.`}
              action={
                <Button size="sm" variant="soft" icon={Plus} onClick={onAddContribution}>
                  Tambah dana
                </Button>
              }
            />

            {contributions.length === 0 ? (
              <EmptyState
                compact
                icon={PiggyBank}
                title="Belum ada setoran"
                description="Mulai dari nominal kecil. Setiap setoran akan muncul di riwayat ini."
                action={
                  <Button size="sm" variant="soft" icon={Plus} onClick={onAddContribution}>
                    Tambah dana pertama
                  </Button>
                }
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {contributions.map((contribution) => {
                  const confirming = confirmId === contribution.id
                  return (
                    <li key={contribution.id} className="surface-muted p-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand/10 text-brand">
                          <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink">
                            {contribution.note.trim() || 'Setoran tabungan'}
                          </p>
                          <p className="text-[0.625rem] font-medium text-ink-3">
                            {formatDateMedium(contribution.date)}
                          </p>
                        </div>
                        <p className="number shrink-0 text-xs font-extrabold text-success">
                          {formatMoney(contribution.amount, currency, { signed: true })}
                        </p>
                        <IconButton
                          label={`Hapus setoran ${formatMoney(contribution.amount, currency)}`}
                          icon={Trash2}
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmId(contribution.id)}
                        />
                      </div>
                      {confirming ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/20 bg-danger/10 p-2">
                          <p className="text-[0.6875rem] font-semibold text-danger">
                            Hapus setoran ini?
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setConfirmId(null)}
                            >
                              Batal
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={Trash2}
                              onClick={() => {
                                onDeleteContribution(contribution)
                                setConfirmId(null)
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
