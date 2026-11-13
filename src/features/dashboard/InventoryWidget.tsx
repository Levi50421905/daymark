import { Link } from 'react-router-dom'
import { Boxes, CircleAlert, Clock3, PackageOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import {
  getInventoryCategoryMeta,
  getInventoryStatus,
  getInventorySummary,
} from '@/lib/calc'
import { daysUntil } from '@/lib/dates'
import { useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types/domain'

function statusLabel(item: InventoryItem): { label: string; className: string } {
  const status = getInventoryStatus(item)
  if (status === 'expired') return { label: 'Kedaluwarsa', className: 'text-danger' }
  if (status === 'expiring') {
    const days = item.expiresAt ? daysUntil(item.expiresAt) : 0
    return { label: days <= 0 ? 'Kedaluwarsa' : `${days} hari lagi`, className: 'text-warning' }
  }
  if (status === 'out') return { label: 'Stok habis', className: 'text-danger' }
  if (status === 'low') return { label: 'Stok menipis', className: 'text-warning' }
  return { label: 'Aman', className: 'text-ink-3' }
}

export function InventoryWidget() {
  const data = useAppData()
  const summary = getInventorySummary(data.inventory)
  const alerts = summary.alerts
    .slice()
    .sort((a, b) => (a.expiresAt ?? '9999').localeCompare(b.expiresAt ?? '9999'))
    .slice(0, 3)

  return (
    <WidgetShell
      title="Stok makanan"
      description={
        summary.alertCount > 0
          ? `${summary.alertCount} barang perlu perhatian`
          : `Semua ${summary.total} barang dalam kondisi baik`
      }
      icon="PackageOpen"
      iconColor="#F0B429"
      action={<WidgetLink to="/inventory" label="Cek" />}
      className="min-h-[240px]"
    >
      {data.inventory.length === 0 ? (
        <EmptyState
          compact
          icon={Boxes}
          title="Stok belum diisi"
          description="Catat bahan makanan agar tidak ada yang terbuang."
          className="py-5"
          action={
            <Link to="/inventory" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Tambah stok →
            </Link>
          }
        />
      ) : alerts.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
            <PackageOpen size={21} strokeWidth={1.8} />
          </span>
          <p className="mt-2 text-xs font-bold text-ink">Stok dalam kondisi baik</p>
          <p className="mt-0.5 text-[0.625rem] text-ink-3">
            {summary.total} barang tercatat · tidak ada peringatan
          </p>
        </div>
      ) : (
        <>
          <div className="mb-2.5 grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-surface-2 px-2 py-1.5 text-center">
              <p className="number text-sm font-extrabold text-ink">{summary.total}</p>
              <p className="text-[0.5rem] font-semibold uppercase tracking-wide text-ink-3">Total</p>
            </div>
            <div className="rounded-lg bg-warning/8 px-2 py-1.5 text-center">
              <p className="number text-sm font-extrabold text-warning">
                {summary.counts.low + summary.counts.out}
              </p>
              <p className="text-[0.5rem] font-semibold uppercase tracking-wide text-ink-3">Menipis</p>
            </div>
            <div className="rounded-lg bg-danger/8 px-2 py-1.5 text-center">
              <p className="number text-sm font-extrabold text-danger">
                {summary.counts.expiring + summary.counts.expired}
              </p>
              <p className="text-[0.5rem] font-semibold uppercase tracking-wide text-ink-3">Expiry</p>
            </div>
          </div>
          <ul className="space-y-1">
            {alerts.map((item) => {
              const meta = getInventoryCategoryMeta(item.category)
              const status = statusLabel(item)
              return (
                <li key={item.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.6875rem] font-bold text-ink">{item.name}</p>
                    <p className="truncate text-[0.5625rem] text-ink-3">
                      {item.quantity} {item.unit} · {item.location}
                    </p>
                  </div>
                  <span className={cn('flex shrink-0 items-center gap-1 text-[0.5625rem] font-bold', status.className)}>
                    {status.label === 'Kedaluwarsa' ? (
                      <CircleAlert size={11} aria-hidden="true" />
                    ) : (
                      <Clock3 size={11} aria-hidden="true" />
                    )}
                    {status.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </WidgetShell>
  )
}
