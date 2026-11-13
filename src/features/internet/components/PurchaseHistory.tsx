import { motion } from 'framer-motion'
import { CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/Card'
import { DynamicIcon, IconTile } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { getPackageProgress } from '@/lib/calc'
import { DEVICE_META } from '@/lib/constants'
import { formatDateMedium } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { listItem, staggerContainer } from '@/lib/motion'
import type { CurrencyCode, DataPackage, Device } from '@/types/domain'
import {
  DEVICE_TONES,
  packageExpiryShort,
  packageStatusMeta,
  quotaText,
} from '../helpers'

interface PurchaseHistoryProps {
  packages: DataPackage[]
  devices: Device[]
  currency: CurrencyCode
  onEdit: (pkg: DataPackage) => void
  onDelete: (pkg: DataPackage) => void
}

export function PurchaseHistory({
  packages,
  devices,
  currency,
  onEdit,
  onDelete,
}: PurchaseHistoryProps) {
  const deviceMap = new Map(devices.map((device) => [device.id, device]))
  const history = [...packages].sort(
    (a, b) => b.purchasedAt.localeCompare(a.purchasedAt) || b.createdAt.localeCompare(a.createdAt),
  )
  const totalSpend = history.reduce((total, pkg) => total + pkg.price, 0)

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-line p-4 sm:p-5">
        <SectionHeading
          title="Riwayat pembelian"
          description={`${history.length} pembelian · ${formatMoney(totalSpend, currency)} total`}
        />
      </div>
      <motion.ul
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.035)}
        className="divide-y divide-line"
      >
        {history.map((pkg) => {
          const progress = getPackageProgress(pkg)
          const meta = packageStatusMeta(pkg, progress.status)
          const device = deviceMap.get(pkg.deviceId)
          const deviceMeta = DEVICE_META[device?.type ?? 'other']
          return (
            <motion.li key={pkg.id} layout variants={listItem} className="px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-3">
                <IconTile
                  icon={deviceMeta.icon}
                  color={DEVICE_TONES[device?.type ?? 'other']}
                  size="md"
                  className="max-sm:hidden"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {pkg.provider}
                        <span className="font-medium text-ink-3">
                          {' · '}
                          {pkg.packageName || 'Paket data'}
                        </span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[0.6875rem] text-ink-3">
                        <DynamicIcon name={deviceMeta.icon} size={11} aria-hidden="true" />
                        <span className="truncate">{device?.name ?? 'Perangkat dihapus'}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <MoneyText
                        amount={pkg.price}
                        currency={currency}
                        className="text-xs font-bold text-ink"
                      />
                      <p className="number mt-0.5 text-[0.625rem] text-ink-3">
                        {quotaText(pkg.quotaGB)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <ProgressBar
                      value={progress.remainingPercent}
                      color={meta.color}
                      height="xs"
                      className="max-w-[160px] min-w-[90px] flex-1"
                    />
                    <span className="number text-[0.6875rem] font-semibold text-ink-2">
                      {quotaText(pkg.remainingGB)} / {quotaText(pkg.quotaGB)}
                    </span>
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-x-1.5 text-[0.625rem] text-ink-3">
                      <span>Dibeli {formatDateMedium(pkg.purchasedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={11} aria-hidden="true" />
                        {packageExpiryShort(pkg, progress.daysLeft)}
                      </span>
                    </p>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label={`Edit paket ${pkg.provider}`}
                        icon={Pencil}
                        size="sm"
                        onClick={() => onEdit(pkg)}
                        className="max-sm:h-11 max-sm:w-11"
                      />
                      <IconButton
                        label={`Hapus paket ${pkg.provider}`}
                        icon={Trash2}
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(pkg)}
                        className="max-sm:h-11 max-sm:w-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}
