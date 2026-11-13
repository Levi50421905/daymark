import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, CreditCard, PackageOpen, Wifi } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { getUpcomingItems, type UpcomingItem } from '@/lib/calc'
import { relativeDueLabel } from '@/lib/dates'
import { useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'

const kindStyles: Record<
  UpcomingItem['kind'],
  { icon: typeof CalendarClock; classes: string }
> = {
  task: { icon: CalendarClock, classes: 'bg-sky/10 text-sky border-sky/15' },
  subscription: { icon: CreditCard, classes: 'bg-lavender/10 text-lavender border-lavender/15' },
  inventory: { icon: PackageOpen, classes: 'bg-warning/10 text-warning border-warning/20' },
  data: { icon: Wifi, classes: 'bg-brand/10 text-brand border-brand/15' },
}

export function UpcomingWidget() {
  const data = useAppData()
  const items = getUpcomingItems(data, 7, 5)

  return (
    <WidgetShell
      title="Jadwal terdekat"
      description="Tujuh hari ke depan"
      icon="CalendarClock"
      iconColor="#8B8FF7"
      action={<WidgetLink to="/planning" label="Rencana" />}
    >
      {items.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarClock}
          title="Tidak ada tenggat mendesak"
          description="Waktu yang lapang untuk mengerjakan hal penting."
          className="py-5"
          action={
            <Link to="/planning" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Lihat rencana →
            </Link>
          }
        />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const style = kindStyles[item.kind]
            const Icon = style.icon
            const overdue = item.tone === 'rose'
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="focus-ring group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border',
                      style.classes,
                    )}
                  >
                    <Icon size={15} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                    <p className="mt-0.5 truncate text-[0.625rem] font-medium text-ink-3">{item.subtitle}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[0.625rem] font-bold',
                      overdue ? 'text-danger' : 'text-ink-3',
                    )}
                  >
                    {relativeDueLabel(item.date)}
                  </span>
                  <ChevronRight
                    size={13}
                    className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetShell>
  )
}
