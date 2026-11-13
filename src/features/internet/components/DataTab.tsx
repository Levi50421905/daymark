import { motion } from 'framer-motion'
import { CircleCheck, Plus, RefreshCw, TriangleAlert, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { CountUp } from '@/components/ui/CountUp'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { getPackageProgress, getPackageSummary } from '@/lib/calc'
import { formatDateMedium, todayISO } from '@/lib/dates'
import { formatPercent } from '@/lib/format'
import { listItem, staggerContainer } from '@/lib/motion'
import type { CurrencyCode, DataPackage, Device } from '@/types/domain'
import { DevicesSection } from './DevicesSection'
import { PackageCard } from './PackageCard'
import { PurchaseHistory } from './PurchaseHistory'
import {
  PACKAGE_STATUS_ORDER,
  packageExpiryShort,
  packageStatusMeta,
  quotaText,
} from '../helpers'

interface DataTabProps {
  devices: Device[]
  packages: DataPackage[]
  currency: CurrencyCode
  onAddPackage: () => void
  onEditPackage: (pkg: DataPackage) => void
  onUpdateRemaining: (pkg: DataPackage) => void
  onAddDevice: () => void
  onEditDevice: (device: Device) => void
  onDeleteDevice: (device: Device) => void
  onDeletePackage: (pkg: DataPackage) => void
}

export function DataTab({
  devices,
  packages,
  currency,
  onAddPackage,
  onEditPackage,
  onUpdateRemaining,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
  onDeletePackage,
}: DataTabProps) {
  const today = todayISO()
  const summary = getPackageSummary(packages, today)
  const progressList = summary.active.map((pkg) => getPackageProgress(pkg, today))
  const ordered = [...progressList].sort(
    (a, b) => PACKAGE_STATUS_ORDER[a.status] - PACKAGE_STATUS_ORDER[b.status] || a.daysLeft - b.daysLeft,
  )
  const alerts = progressList
    .filter((progress) => progress.status === 'low' || progress.status === 'expiring')
    .sort((a, b) => PACKAGE_STATUS_ORDER[a.status] - PACKAGE_STATUS_ORDER[b.status])
  const totalQuota = summary.active.reduce((total, pkg) => total + pkg.quotaGB, 0)
  const remainingPercent =
    totalQuota > 0 ? Math.min(100, (summary.totalRemainingGB / totalQuota) * 100) : 0
  const expiringCount = progressList.filter((progress) => progress.status === 'expiring').length
  const deviceMap = new Map(devices.map((device) => [device.id, device]))
  const lastPurchase = summary.lastPurchase

  if (packages.length === 0) {
    const hasDevices = devices.length > 0
    return (
      <div className="space-y-5">
        <Card padding="none" className="hero-gradient overflow-hidden">
          <EmptyState
            icon={Wifi}
            title={hasDevices ? 'Belum ada paket data' : 'Mulai dari perangkatmu'}
            description={
              hasDevices
                ? 'Catat paket yang sedang aktif. Daymark akan mengingatkan sisa kuota yang menipis dan masa aktif yang segera berakhir.'
                : 'Tambahkan perangkat dulu — misalnya smartphone atau router — lalu catat paket data yang dipakainya.'
            }
            action={
              <Button
                icon={Plus}
                onClick={hasDevices ? onAddPackage : onAddDevice}
                className="max-sm:min-h-11"
              >
                {hasDevices ? 'Tambah paket' : 'Tambah perangkat'}
              </Button>
            }
            secondaryAction={
              hasDevices ? (
                <Button
                  variant="secondary"
                  icon={Plus}
                  onClick={onAddDevice}
                  className="max-sm:min-h-11"
                >
                  Tambah perangkat
                </Button>
              ) : undefined
            }
          />
        </Card>
        {hasDevices ? (
          <DevicesSection
            devices={devices}
            packages={packages}
            onAdd={onAddDevice}
            onEdit={onEditDevice}
            onDelete={onDeleteDevice}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card padding="none" className="hero-gradient relative min-w-0 overflow-hidden p-5 sm:p-6">
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/40 blur-2xl dark:bg-brand/10"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-2">
              Total sisa kuota
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <CountUp
                value={summary.totalRemainingGB}
                format={quotaText}
                className="text-[2.05rem] font-extrabold leading-none tracking-[-0.04em] text-ink"
              />
              <span className="text-xs font-semibold text-ink-2">tersisa</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-2">
              dari {quotaText(totalQuota)} kuota aktif · {summary.active.length} paket berjalan.
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 text-[0.6875rem] font-semibold text-ink-2">
              <span>Kuota tersisa</span>
              <span className="number">{formatPercent(remainingPercent)}</span>
            </div>
            <ProgressBar
              value={remainingPercent}
              color="var(--c-brand)"
              className="mt-1.5"
              trackClassName="bg-white/60 dark:bg-white/10"
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <HeroStat label="Paket aktif" value={String(summary.active.length)} />
              <HeroStat label="Total kuota" value={quotaText(totalQuota)} />
              <HeroStat label="Berakhir ≤3 hari" value={String(expiringCount)} />
            </div>
          </div>
        </Card>

        <Card padding="none" className="flex min-w-0 flex-col p-4 sm:p-5">
          <SectionHeading
            title="Perlu perhatian"
            description={
              alerts.length > 0
                ? `${alerts.length} paket mendesak untuk dicek.`
                : summary.active.length > 0
                  ? 'Kuota dan masa aktif masih aman.'
                  : 'Belum ada paket aktif saat ini.'
            }
            action={
              <Badge tone={alerts.length > 0 ? 'amber' : 'mint'}>{alerts.length}</Badge>
            }
          />
          <div className="mt-3 flex-1 space-y-2">
            {alerts.length > 0 ? (
              alerts.slice(0, 3).map((progress) => {
                const meta = packageStatusMeta(progress.pkg, progress.status)
                const device = deviceMap.get(progress.pkg.deviceId)
                return (
                  <div
                    key={progress.pkg.id}
                    className="flex items-center gap-2.5 rounded-2xl bg-surface-2 p-2.5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">
                        {progress.pkg.provider} · {progress.pkg.packageName || 'Paket data'}
                      </p>
                      <p className="mt-0.5 truncate text-[0.625rem] text-ink-3">
                        {device?.name ?? 'Perangkat dihapus'} · {meta.label} ·{' '}
                        {packageExpiryShort(progress.pkg, progress.daysLeft)} · sisa{' '}
                        {quotaText(progress.pkg.remainingGB)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={RefreshCw}
                      onClick={() => onUpdateRemaining(progress.pkg)}
                      className="max-sm:min-h-11"
                    >
                      Perbarui
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-2 px-3 py-5 text-center">
                <CircleCheck
                  size={20}
                  className={summary.active.length > 0 ? 'text-success' : 'text-ink-3'}
                  aria-hidden="true"
                />
                <p className="mt-1.5 text-xs font-semibold text-ink">
                  {summary.active.length > 0 ? 'Semua terkendali' : 'Belum ada paket aktif'}
                </p>
                <p className="mt-0.5 max-w-[16rem] text-[0.625rem] leading-relaxed text-ink-3">
                  {summary.active.length > 0
                    ? 'Tidak ada kuota menipis atau paket yang segera berakhir.'
                    : 'Tambahkan paket baru untuk mulai memantau kuota.'}
                </p>
              </div>
            )}
            {alerts.length > 3 ? (
              <p className="flex items-center gap-1 text-[0.625rem] text-ink-3">
                <TriangleAlert size={11} aria-hidden="true" />
                +{alerts.length - 3} paket lain juga butuh perhatian.
              </p>
            ) : null}
          </div>
          {lastPurchase ? (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                Pembelian terakhir
              </p>
              <div className="mt-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">
                    {lastPurchase.provider} · {lastPurchase.packageName || 'Paket data'}
                  </p>
                  <p className="mt-0.5 text-[0.625rem] text-ink-3">
                    {formatDateMedium(lastPurchase.purchasedAt)} ·{' '}
                    {deviceMap.get(lastPurchase.deviceId)?.name ?? 'Perangkat dihapus'}
                  </p>
                </div>
                <MoneyText
                  amount={lastPurchase.price}
                  currency={currency}
                  className="shrink-0 text-xs font-bold text-ink-2"
                />
              </div>
            </div>
          ) : null}
          {summary.expiredCount > 0 ? (
            <p className="mt-3 text-[0.625rem] leading-relaxed text-ink-3">
              {summary.expiredCount} paket sudah berakhir — lihat riwayat di bawah.
            </p>
          ) : null}
        </Card>
      </div>

      <DevicesSection
        devices={devices}
        packages={packages}
        onAdd={onAddDevice}
        onEdit={onEditDevice}
        onDelete={onDeleteDevice}
      />

      <section>
        <SectionHeading
          title="Paket aktif"
          description="Ringkasan kuota, masa aktif, dan status tiap paket."
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={onAddPackage}
              className="max-sm:min-h-11"
            >
              Tambah paket
            </Button>
          }
        />
        {ordered.length > 0 ? (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.05)}
            className="mt-3 grid gap-3 md:grid-cols-2"
          >
            {ordered.map((progress) => (
              <motion.li key={progress.pkg.id} layout variants={listItem}>
                <PackageCard
                  progress={progress}
                  device={deviceMap.get(progress.pkg.deviceId)}
                  currency={currency}
                  onEdit={() => onEditPackage(progress.pkg)}
                  onUpdateRemaining={() => onUpdateRemaining(progress.pkg)}
                  onDelete={() => onDeletePackage(progress.pkg)}
                />
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <div className="surface-card mt-3">
            <EmptyState
              compact
              icon={WifiOff}
              title="Tidak ada paket aktif"
              description="Semua paket sudah berakhir atau kuotanya habis. Tambahkan paket baru untuk lanjut memantau."
              action={
                <Button size="sm" icon={Plus} onClick={onAddPackage}>
                  Tambah paket
                </Button>
              }
            />
          </div>
        )}
      </section>

      {packages.length > 0 ? (
        <PurchaseHistory
          packages={packages}
          devices={devices}
          currency={currency}
          onEdit={onEditPackage}
          onDelete={onDeletePackage}
        />
      ) : null}
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/50 px-3 py-2.5 dark:bg-white/5">
      <p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-3">{label}</p>
      <p className="number mt-0.5 truncate text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}
