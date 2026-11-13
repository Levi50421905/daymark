import { Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import { CircularProgress } from '@/components/charts/DonutChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/Progress'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { getSavingsOverview } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { useAppData } from '@/lib/store'

export function GoalsWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const savings = getSavingsOverview(data)
  const topGoals = savings.goals.slice(0, 2)

  return (
    <WidgetShell
      title="Target tabungan"
      description="Progres tujuan finansialmu"
      icon="Target"
      iconColor="#3BBFA3"
      action={<WidgetLink to="/finance" label="Target" />}
      className="min-h-[240px]"
    >
      {savings.goals.length === 0 ? (
        <EmptyState
          compact
          icon={Target}
          title="Belum ada target"
          description="Tentukan tujuan agar menabung terasa lebih nyata."
          className="py-5"
          action={
            <Link to="/finance" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Buat target →
            </Link>
          }
        />
      ) : (
        <div className="flex items-center gap-4">
          <CircularProgress
            value={savings.progress}
            size={82}
            strokeWidth={7}
            color="var(--c-mint)"
            ariaLabel="Progress seluruh target tabungan"
          >
            <span className="number text-xs font-extrabold text-ink">{Math.round(savings.progress)}%</span>
          </CircularProgress>
          <div className="min-w-0 flex-1">
            <p className="number text-base font-extrabold tracking-[-0.03em] text-ink">
              {formatMoney(savings.totalSaved, currency, { compact: true })}
            </p>
            <p className="text-[0.625rem] text-ink-3">
              dari {formatMoney(savings.totalTarget, currency, { compact: true })}
            </p>
            <div className="mt-2 space-y-2">
              {topGoals.map((goal) => (
                <div key={goal.goal.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[0.625rem] font-semibold text-ink-2">{goal.goal.name}</span>
                    <span className="number shrink-0 text-[0.5625rem] font-bold text-ink-3">
                      {Math.round(goal.progress)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, goal.progress)}
                    height="xs"
                    color={goal.goal.color}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
