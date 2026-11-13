import { motion } from 'framer-motion'
import { CalendarClock, Check, CircleCheck, Plus, ReceiptText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { getMonthlySubscriptionCost, getUpcomingSubscriptions } from '@/lib/calc'
import { formatDateMedium, todayISO } from '@/lib/dates'
import { listItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Category, CurrencyCode, Subscription, Transaction } from '@/types/domain'
import { SubscriptionCard } from './SubscriptionCard'
import { monthlyEquivalent, subscriptionDueMeta } from '../helpers'

interface SubscriptionsTabProps {
  subscriptions: Subscription[]
  transactions: Transaction[]
  categories: Category[]
  currency: CurrencyCode
  onAdd: () => void
  onEdit: (subscription: Subscription) => void
  onPay: (subscription: Subscription) => void
  onToggle: (subscription: Subscription) => void
  onDelete: (subscription: Subscription) => void
}

export function SubscriptionsTab({
  subscriptions,
  transactions,
  categories,
  currency,
  onAdd,
  onEdit,
  onPay,
  onToggle,
  onDelete,
}: SubscriptionsTabProps) {
  const today = todayISO()
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const subscriptionById = new Map(subscriptions.map((subscription) => [subscription.id, subscription]))
  const activeSubscriptions = subscriptions
    .filter((subscription) => subscription.active)
    .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate))
  const pausedSubscriptions = subscriptions
    .filter((subscription) => !subscription.active)
    .sort((a, b) => a.name.localeCompare(b.name))
  const monthlyCost = getMonthlySubscriptionCost(subscriptions)
  const upcoming = getUpcomingSubscriptions(subscriptions, 14, today)
  const upcomingTotal = upcoming.reduce((total, subscription) => total + subscription.amount, 0)
  const payments = transactions
    .filter(
      (transaction) => transaction.type === 'expense' && transaction.source?.kind === 'subscription',
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const categoryTotals = new Map<string, number>()
  for (const subscription of activeSubscriptions) {
    const key = subscription.categoryId ?? '__none'
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + monthlyEquivalent(subscription))
  }
  const breakdown = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, amount]) => {
      const category = key === '__none' ? undefined : categoryById.get(key)
      return {
        id: key,
        label: category?.name ?? 'Tanpa kategori',
        color: category?.color ?? 'var(--c-lavender)',
        amount,
      }
    })

  if (subscriptions.length === 0) {
    return (
      <div className="surface-card">
        <EmptyState
          icon={CalendarClock}
          title="Belum ada langganan"
          description="Catat langganan rutin seperti streaming, cloud, atau internet rumah. Daymark menghitung biaya bulanannya dan mengingatkan tanggal bayar."
          action={
            <Button icon={Plus} onClick={onAdd} className="max-sm:min-h-11">
              Tambah langganan
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card padding="none" className="hero-gradient relative overflow-hidden p-5 sm:p-6">
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/40 blur-2xl dark:bg-brand/10"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-2">
                  Biaya langganan bulanan
                </p>
                <MoneyText
                  animated
                  amount={monthlyCost}
                  currency={currency}
                  className="mt-1.5 text-[2.05rem] font-extrabold leading-none tracking-[-0.04em] text-ink"
                />
                <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-2">
                  <span>≈</span>
                  <MoneyText
                    amount={monthlyCost * 12}
                    currency={currency}
                    compact
                    className="font-semibold"
                  />
                  <span>per tahun · {activeSubscriptions.length} langganan aktif</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="mint" dot>
                  {activeSubscriptions.length} aktif
                </Badge>
                {pausedSubscriptions.length > 0 ? (
                  <Badge tone="neutral">{pausedSubscriptions.length} dijeda</Badge>
                ) : null}
              </div>
            </div>

            {breakdown.length > 0 ? (
              <div className="mt-4 space-y-2 border-t border-white/50 pt-3 dark:border-white/10">
                {breakdown.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-medium text-ink-2">
                      {item.label}
                    </span>
                    <ProgressBar
                      value={monthlyCost > 0 ? (item.amount / monthlyCost) * 100 : 0}
                      color={item.color}
                      height="xs"
                      className="w-16 sm:w-24"
                    />
                    <MoneyText
                      amount={item.amount}
                      currency={currency}
                      compact
                      className="w-16 shrink-0 text-right text-[0.6875rem] font-semibold text-ink sm:w-20"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card padding="none" className="flex flex-col p-4 sm:p-5">
          <SectionHeading
            title="Tagihan terdekat"
            description="Langganan aktif yang jatuh tempo dalam 14 hari, termasuk yang terlambat."
            action={<Badge tone={upcoming.length > 0 ? 'lavender' : 'neutral'}>{upcoming.length}</Badge>}
          />
          <div className="mt-3 flex-1 space-y-1">
            {upcoming.length > 0 ? (
              upcoming.slice(0, 5).map((subscription) => {
                const due = subscriptionDueMeta(subscription.nextPaymentDate, today)
                const category = subscription.categoryId
                  ? categoryById.get(subscription.categoryId) ?? null
                  : null
                return (
                  <div
                    key={subscription.id}
                    className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5"
                  >
                    <CategoryIcon
                      icon={category?.icon ?? 'Wallet'}
                      color={category?.color ?? 'var(--c-lavender)'}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{subscription.name}</p>
                      <p
                        className={cn(
                          'text-[0.625rem] font-medium',
                          due.kind === 'overdue'
                            ? 'text-danger'
                            : due.kind === 'today'
                              ? 'text-warning'
                              : 'text-ink-3',
                        )}
                      >
                        {due.label} · {formatDateMedium(subscription.nextPaymentDate)}
                      </p>
                    </div>
                    <MoneyText
                      amount={subscription.amount}
                      currency={currency}
                      className="shrink-0 text-xs font-bold text-ink"
                    />
                    <IconButton
                      label={`Tandai ${subscription.name} dibayar`}
                      icon={Check}
                      size="sm"
                      variant="soft"
                      onClick={() => onPay(subscription)}
                      className="max-sm:h-11 max-sm:w-11"
                    />
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CircleCheck size={20} className="text-success" aria-hidden="true" />
                <p className="mt-1.5 text-xs font-semibold text-ink">Tidak ada tagihan dekat</p>
                <p className="mt-0.5 max-w-[16rem] text-[0.625rem] leading-relaxed text-ink-3">
                  Semua langganan aktif masih jauh dari jatuh tempo.
                </p>
              </div>
            )}
            {upcoming.length > 5 ? (
              <p className="pl-1 text-[0.625rem] text-ink-3">
                +{upcoming.length - 5} tagihan lain dalam 14 hari.
              </p>
            ) : null}
          </div>
          {upcoming.length > 0 ? (
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[0.6875rem] font-medium text-ink-3">Total tagihan dekat</span>
              <MoneyText
                amount={upcomingTotal}
                currency={currency}
                className="text-xs font-extrabold text-ink"
              />
            </div>
          ) : null}
        </Card>
      </div>

      <section>
        <SectionHeading
          title="Langganan aktif"
          description="Perkiraan biaya bulanan dan status tagihan tiap langganan."
        />
        {activeSubscriptions.length > 0 ? (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.05)}
            className="mt-3 grid gap-3 lg:grid-cols-2"
          >
            {activeSubscriptions.map((subscription) => (
              <motion.li key={subscription.id} layout variants={listItem}>
                <SubscriptionCard
                  subscription={subscription}
                  category={
                    subscription.categoryId
                      ? categoryById.get(subscription.categoryId) ?? null
                      : null
                  }
                  currency={currency}
                  onEdit={() => onEdit(subscription)}
                  onPay={() => onPay(subscription)}
                  onToggle={() => onToggle(subscription)}
                  onDelete={() => onDelete(subscription)}
                />
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <div className="surface-card mt-3">
            <EmptyState
              compact
              icon={CircleCheck}
              title="Semua langganan dijeda"
              description="Aktifkan kembali salah satu langganan untuk melihat jadwal tagihannya lagi."
            />
          </div>
        )}
      </section>

      {pausedSubscriptions.length > 0 ? (
        <section>
          <SectionHeading
            title="Dijeda"
            description="Tidak ikut dihitung dalam biaya bulanan sampai diaktifkan lagi."
          />
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.05)}
            className="mt-3 grid gap-3 lg:grid-cols-2"
          >
            {pausedSubscriptions.map((subscription) => (
              <motion.li key={subscription.id} layout variants={listItem}>
                <SubscriptionCard
                  subscription={subscription}
                  category={
                    subscription.categoryId
                      ? categoryById.get(subscription.categoryId) ?? null
                      : null
                  }
                  currency={currency}
                  onEdit={() => onEdit(subscription)}
                  onPay={() => onPay(subscription)}
                  onToggle={() => onToggle(subscription)}
                  onDelete={() => onDelete(subscription)}
                />
              </motion.li>
            ))}
          </motion.ul>
        </section>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-b border-line p-4 sm:p-5">
          <SectionHeading
            title="Pembayaran langganan"
            description="Pengeluaran yang tercatat lewat tombol Tandai dibayar."
            action={<Badge tone="neutral">{payments.length}</Badge>}
          />
        </div>
        {payments.length > 0 ? (
          <ul className="divide-y divide-line">
            {payments.slice(0, 8).map((transaction) => {
              const category = categoryById.get(transaction.categoryId)
              const subscription = transaction.source
                ? subscriptionById.get(transaction.source.id)
                : undefined
              return (
                <li
                  key={transaction.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <CategoryIcon
                    icon={category?.icon ?? 'ReceiptText'}
                    color={category?.color ?? 'var(--c-ink-3)'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">
                      {subscription?.name ?? (transaction.note || 'Langganan')}
                    </p>
                    <p className="mt-0.5 text-[0.625rem] text-ink-3">
                      {formatDateMedium(transaction.date)} · {category?.name ?? 'Tanpa kategori'}
                    </p>
                  </div>
                  <MoneyText
                    amount={transaction.amount}
                    currency={currency}
                    className="shrink-0 text-xs font-bold text-ink"
                  />
                </li>
              )
            })}
            {payments.length > 8 ? (
              <li className="px-4 py-2.5 text-[0.625rem] text-ink-3 sm:px-5">
                Menampilkan 8 pembayaran terakhir dari {payments.length}. Catatan lengkap ada di
                Finance.
              </li>
            ) : null}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={ReceiptText}
            title="Belum ada pembayaran"
            description="Saat kamu menandai langganan dibayar, pengeluarannya tercatat di sini sekaligus di Finance."
          />
        )}
      </section>
    </div>
  )
}
