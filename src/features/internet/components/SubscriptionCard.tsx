import { Check, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { Switch } from '@/components/ui/Progress'
import { formatDateMedium, todayISO } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Category, CurrencyCode, Subscription } from '@/types/domain'
import { cycleLabel, cycleShort, monthlyEquivalent, subscriptionDueMeta } from '../helpers'

interface SubscriptionCardProps {
  subscription: Subscription
  category: Category | null
  currency: CurrencyCode
  onEdit: () => void
  onPay: () => void
  onToggle: () => void
  onDelete: () => void
}

export function SubscriptionCard({
  subscription,
  category,
  currency,
  onEdit,
  onPay,
  onToggle,
  onDelete,
}: SubscriptionCardProps) {
  const active = subscription.active
  const due = subscriptionDueMeta(subscription.nextPaymentDate, todayISO())
  const dueLabel = active ? (due.kind === 'upcoming' ? 'Terjadwal' : due.label) : 'Dijeda'
  const monthlyNote =
    subscription.cycle === 'monthly'
      ? 'Sesuai nominal'
      : subscription.cycle === 'weekly'
        ? 'Dari tagihan mingguan'
        : 'Dari tagihan tahunan'

  return (
    <div className={cn('surface-card flex h-full flex-col p-4', !active && 'bg-surface-2')}>
      <div className="flex items-start gap-3">
        <CategoryIcon
          icon={category?.icon ?? 'Wallet'}
          color={category?.color ?? 'var(--c-lavender)'}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{subscription.name}</p>
          <p className="truncate text-[0.6875rem] text-ink-3">
            {cycleLabel(subscription.cycle)} · {category?.name ?? 'Tanpa kategori'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <MoneyText
            amount={subscription.amount}
            currency={currency}
            className="text-sm font-extrabold text-ink"
          />
          <p className="text-[0.625rem] text-ink-3">/ {cycleShort(subscription.cycle)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="surface-muted px-3 py-2">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
            Tagihan berikutnya
          </p>
          <p className="mt-0.5 text-[0.6875rem] font-semibold text-ink">
            {formatDateMedium(subscription.nextPaymentDate)}
          </p>
          <Badge tone={active ? due.tone : 'neutral'} dot className="mt-1.5">
            {dueLabel}
          </Badge>
        </div>
        <div className="surface-muted px-3 py-2">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
            Setara per bulan
          </p>
          <MoneyText
            amount={monthlyEquivalent(subscription)}
            currency={currency}
            className="mt-1 block text-[0.8125rem] font-extrabold text-ink"
          />
          <p className="mt-0.5 text-[0.5625rem] text-ink-3">{monthlyNote}</p>
        </div>
      </div>

      {subscription.note ? (
        <p className="mt-2.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-ink-3">
          {subscription.note}
        </p>
      ) : null}

      <div className="mt-auto border-t border-line pt-3">
        <div className="mt-3 flex items-center justify-between gap-2">
          <Switch checked={active} onChange={onToggle} label={active ? 'Aktif' : 'Dijeda'} />
          <div className="flex items-center gap-1">
            <IconButton
              label={`Edit ${subscription.name}`}
              icon={Pencil}
              size="sm"
              onClick={onEdit}
              className="max-sm:h-11 max-sm:w-11"
            />
            <IconButton
              label={`Hapus ${subscription.name}`}
              icon={Trash2}
              size="sm"
              variant="danger"
              onClick={onDelete}
              className="max-sm:h-11 max-sm:w-11"
            />
          </div>
        </div>
        {active ? (
          <Button
            variant="soft"
            size="sm"
            icon={Check}
            onClick={onPay}
            className="mt-2 w-full max-sm:min-h-11"
          >
            Tandai dibayar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
