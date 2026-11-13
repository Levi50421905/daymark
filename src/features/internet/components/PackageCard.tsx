import { CalendarClock, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { CircularProgress } from '@/components/charts/DonutChart'
import type { PackageProgress } from '@/lib/calc'
import { DEVICE_META } from '@/lib/constants'
import { formatMoney } from '@/lib/format'
import type { CurrencyCode, Device } from '@/types/domain'
import { packageExpiryLabel, packageStatusMeta, quotaText } from '../helpers'

interface PackageCardProps {
  progress: PackageProgress
  device: Device | undefined
  currency: CurrencyCode
  onEdit: () => void
  onUpdateRemaining: () => void
  onDelete: () => void
}

export function PackageCard({
  progress,
  device,
  currency,
  onEdit,
  onUpdateRemaining,
  onDelete,
}: PackageCardProps) {
  const { pkg, remainingPercent, daysLeft } = progress
  const meta = packageStatusMeta(pkg, progress.status)
  const pricePerGB = pkg.quotaGB > 0 ? pkg.price / pkg.quotaGB : 0

  return (
    <div className="surface-card h-full p-4">
      <div className="flex items-start gap-4">
        <CircularProgress
          value={remainingPercent}
          size={78}
          strokeWidth={7}
          color={meta.color}
          ariaLabel={`Sisa kuota ${quotaText(pkg.remainingGB)} dari ${quotaText(pkg.quotaGB)}`}
        >
          <span className="number text-base font-extrabold leading-none text-ink">
            {Math.round(remainingPercent)}%
          </span>
          <span className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
            sisa
          </span>
        </CircularProgress>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{pkg.provider}</p>
              <p className="truncate text-xs text-ink-3">{pkg.packageName || 'Paket data'}</p>
            </div>
            <Badge tone={meta.tone} dot className="shrink-0">
              {meta.label}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-ink-3">
            <span className="inline-flex min-w-0 items-center gap-1">
              <DynamicIcon
                name={DEVICE_META[device?.type ?? 'other'].icon}
                size={12}
                aria-hidden="true"
              />
              <span className="truncate">{device?.name ?? 'Perangkat dihapus'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock size={12} aria-hidden="true" />
              {packageExpiryLabel(pkg, daysLeft)}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                Sisa kuota
              </p>
              <p className="number text-sm font-extrabold text-ink">
                {quotaText(pkg.remainingGB)}
                <span className="ml-1 text-[0.6875rem] font-medium text-ink-3">
                  / {quotaText(pkg.quotaGB)}
                </span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <MoneyText amount={pkg.price} currency={currency} className="text-xs font-bold text-ink-2" />
              {pricePerGB > 0 ? (
                <p className="number text-[0.5625rem] text-ink-3">
                  ≈ {formatMoney(pricePerGB, currency)}/GB
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
        <Button
          variant="soft"
          size="sm"
          icon={RefreshCw}
          onClick={onUpdateRemaining}
          className="max-sm:min-h-11"
        >
          Perbarui sisa
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={`Edit ${pkg.provider} ${pkg.packageName}`}
            icon={Pencil}
            size="sm"
            onClick={onEdit}
            className="max-sm:h-11 max-sm:w-11"
          />
          <IconButton
            label={`Hapus ${pkg.provider} ${pkg.packageName}`}
            icon={Trash2}
            size="sm"
            variant="danger"
            onClick={onDelete}
            className="max-sm:h-11 max-sm:w-11"
          />
        </div>
      </div>
    </div>
  )
}
