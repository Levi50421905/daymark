import { motion } from 'framer-motion'
import { Pencil, Plus, Trash2, Wifi } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/CategoryIcon'
import { getActivePackages } from '@/lib/calc'
import { DEVICE_META } from '@/lib/constants'
import { listItem, staggerContainer } from '@/lib/motion'
import type { DataPackage, Device } from '@/types/domain'
import { DEVICE_TONES, quotaText } from '../helpers'

interface DevicesSectionProps {
  devices: Device[]
  packages: DataPackage[]
  onAdd: () => void
  onEdit: (device: Device) => void
  onDelete: (device: Device) => void
}

export function DevicesSection({ devices, packages, onAdd, onEdit, onDelete }: DevicesSectionProps) {
  const activePackages = getActivePackages(packages)

  return (
    <section>
      <SectionHeading
        title="Perangkat"
        description="Setiap paket data terhubung ke satu perangkat."
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={onAdd}
            className="max-sm:min-h-11"
          >
            Tambah perangkat
          </Button>
        }
      />
      {devices.length > 0 ? (
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.05)}
          className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {devices.map((device) => {
            const devicePackages = activePackages.filter((pkg) => pkg.deviceId === device.id)
            const remaining = devicePackages.reduce((total, pkg) => total + pkg.remainingGB, 0)
            return (
              <motion.li
                key={device.id}
                layout
                variants={listItem}
                className="surface-card flex items-start gap-3 p-4"
              >
                <IconTile
                  icon={DEVICE_META[device.type].icon}
                  color={DEVICE_TONES[device.type]}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{device.name}</p>
                      <p className="text-[0.6875rem] font-medium text-ink-3">
                        {DEVICE_META[device.type].label}
                      </p>
                    </div>
                    <div className="-mr-1.5 -mt-1 flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label={`Edit ${device.name}`}
                        icon={Pencil}
                        size="sm"
                        onClick={() => onEdit(device)}
                        className="max-sm:h-11 max-sm:w-11"
                      />
                      <IconButton
                        label={`Hapus ${device.name}`}
                        icon={Trash2}
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(device)}
                        className="max-sm:h-11 max-sm:w-11"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-ink-2">
                    {devicePackages.length > 0 ? (
                      <>
                        <Wifi size={12} className="shrink-0 text-brand" aria-hidden="true" />
                        <span className="truncate">
                          <span className="number font-semibold">{quotaText(remaining)}</span> tersisa
                          {' · '}
                          {devicePackages.length} paket
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-3">Belum ada paket aktif</span>
                    )}
                  </div>
                  {device.note ? (
                    <p className="mt-1 truncate text-[0.625rem] leading-relaxed text-ink-3">
                      {device.note}
                    </p>
                  ) : null}
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      ) : (
        <div className="surface-muted mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-xs leading-relaxed text-ink-3">
            Belum ada perangkat. Tambahkan dulu agar paket data punya tempat.
          </p>
          <Button
            variant="soft"
            size="sm"
            icon={Plus}
            onClick={onAdd}
            className="max-sm:min-h-11"
          >
            Tambah perangkat
          </Button>
        </div>
      )}
    </section>
  )
}
