import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Plus, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { formatDateMedium } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { actions, useAppData } from '@/lib/store'
import type { CurrencyCode, DataPackage, Device, Subscription } from '@/types/domain'
import { DataTab } from './components/DataTab'
import { DeviceFormModal } from './components/DeviceFormModal'
import { PackageFormModal } from './components/PackageFormModal'
import { RemainingQuotaModal } from './components/RemainingQuotaModal'
import { SubscriptionFormModal } from './components/SubscriptionFormModal'
import { SubscriptionsTab } from './components/SubscriptionsTab'
import { errorText } from './helpers'

type InternetTab = 'packages' | 'subscriptions'

type PendingAction =
  | { kind: 'device'; device: Device }
  | { kind: 'package'; pkg: DataPackage }
  | { kind: 'subscription'; subscription: Subscription }
  | { kind: 'payment'; subscription: Subscription }

interface ConfirmCopy {
  title: string
  description: string
  confirmLabel: string
  tone: 'danger' | 'primary'
}

export default function InternetPage() {
  const data = useAppData()
  const toast = useToast()
  const currency: CurrencyCode = data.settings.currency

  const [tab, setTab] = useState<InternetTab>('packages')
  const [deviceDialog, setDeviceDialog] = useState<{ open: boolean; device: Device | null }>({
    open: false,
    device: null,
  })
  const [packageDialog, setPackageDialog] = useState<{ open: boolean; pkg: DataPackage | null }>({
    open: false,
    pkg: null,
  })
  const [remainingTarget, setRemainingTarget] = useState<DataPackage | null>(null)
  const [subscriptionDialog, setSubscriptionDialog] = useState<{
    open: boolean
    subscription: Subscription | null
  }>({ open: false, subscription: null })
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  function openPackageForm(pkg: DataPackage | null) {
    if (!data.devices.length) {
      toast({
        tone: 'info',
        title: 'Tambahkan perangkat dulu',
        description: 'Setiap paket data terhubung ke satu perangkat.',
      })
      setDeviceDialog({ open: true, device: null })
      return
    }
    setPackageDialog({ open: true, pkg })
  }

  function buildConfirmCopy(action: PendingAction): ConfirmCopy {
    if (action.kind === 'device') {
      const relatedPackages = data.dataPackages.filter(
        (pkg) => pkg.deviceId === action.device.id,
      ).length
      return {
        title: 'Hapus perangkat?',
        description: relatedPackages
          ? `"${action.device.name}" dan ${relatedPackages} paket data terkait akan dihapus. Riwayat kuotanya tidak bisa dikembalikan.`
          : `"${action.device.name}" akan dihapus dari daftar perangkat.`,
        confirmLabel: 'Hapus perangkat',
        tone: 'danger',
      }
    }
    if (action.kind === 'package') {
      return {
        title: 'Hapus paket data?',
        description: `${action.pkg.provider} · ${
          action.pkg.packageName || 'Paket data'
        } akan dihapus dari riwayat pembelian.`,
        confirmLabel: 'Hapus paket',
        tone: 'danger',
      }
    }
    if (action.kind === 'subscription') {
      return {
        title: 'Hapus langganan?',
        description: `"${action.subscription.name}" akan dihapus dari daftar. Pengeluaran yang sudah tercatat di Finance tetap tersimpan.`,
        confirmLabel: 'Hapus langganan',
        tone: 'danger',
      }
    }
    return {
      title: 'Tandai sudah dibayar?',
      description: `${action.subscription.name} sebesar ${formatMoney(
        action.subscription.amount,
        currency,
      )} akan dicatat sebagai pengeluaran hari ini di Finance, lalu tanggal tagihan dimajukan otomatis.`,
      confirmLabel: 'Tandai dibayar',
      tone: 'primary',
    }
  }

  async function handleConfirm() {
    if (!pending) return
    setConfirmBusy(true)
    try {
      if (pending.kind === 'device') {
        actions.deleteDevice(pending.device.id)
        toast({
          tone: 'success',
          title: 'Perangkat dihapus',
          description: `"${pending.device.name}" beserta paket datanya sudah dihapus.`,
        })
      } else if (pending.kind === 'package') {
        actions.deleteDataPackage(pending.pkg.id)
        toast({
          tone: 'success',
          title: 'Paket data dihapus',
          description: `${pending.pkg.provider} · ${
            pending.pkg.packageName || 'Paket data'
          } keluar dari riwayat.`,
        })
      } else if (pending.kind === 'subscription') {
        actions.deleteSubscription(pending.subscription.id)
        toast({
          tone: 'success',
          title: 'Langganan dihapus',
          description: `"${pending.subscription.name}" tidak lagi dipantau. Transaksi lamanya tetap ada di Finance.`,
        })
      } else {
        const { subscription } = pending
        actions.paySubscription(subscription.id)
        const updated = actions
          .getData()
          .subscriptions.find((item) => item.id === subscription.id)
        toast({
          tone: 'success',
          title: 'Pembayaran dicatat',
          description: `${subscription.name} ${formatMoney(
            subscription.amount,
            currency,
          )} tersimpan sebagai pengeluaran${
            updated ? ` · tagihan berikutnya ${formatDateMedium(updated.nextPaymentDate)}` : ''
          }.`,
        })
      }
    } catch (error) {
      toast({
        tone: 'error',
        title: pending.kind === 'payment' ? 'Gagal menandai pembayaran' : 'Gagal menghapus data',
        description: errorText(error),
      })
    } finally {
      setConfirmBusy(false)
      setPending(null)
    }
  }

  function handleToggleSubscription(subscription: Subscription) {
    try {
      actions.toggleSubscription(subscription.id)
      toast(
        subscription.active
          ? {
              tone: 'success',
              title: 'Langganan dijeda',
              description: `${subscription.name} tidak akan ditagih sampai diaktifkan lagi.`,
            }
          : {
              tone: 'success',
              title: 'Langganan diaktifkan',
              description: `${subscription.name} kembali masuk jadwal tagihan.`,
            },
      )
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal mengubah status',
        description: errorText(error),
      })
    }
  }

  const confirmCopy: ConfirmCopy = pending
    ? buildConfirmCopy(pending)
    : { title: '', description: '', confirmLabel: 'Hapus', tone: 'danger' }

  return (
    <div>
      <PageHeader
        eyebrow="Internet"
        title="Internet & langganan"
        description="Pantau sisa kuota tiap perangkat dan biaya langganan yang berjalan."
        actions={
          tab === 'packages' ? (
            <Button icon={Plus} size="lg" onClick={() => openPackageForm(null)}>
              Tambah paket
            </Button>
          ) : (
            <Button
              icon={Plus}
              size="lg"
              onClick={() => setSubscriptionDialog({ open: true, subscription: null })}
            >
              Tambah langganan
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          ariaLabel="Pilih tampilan Internet"
          options={[
            {
              value: 'packages',
              label: 'Paket Data',
              icon: Wifi,
              count: data.dataPackages.length,
            },
            {
              value: 'subscriptions',
              label: 'Langganan',
              icon: CalendarClock,
              count: data.subscriptions.length,
            },
          ]}
        />
        <p className="hidden text-[0.6875rem] leading-relaxed text-ink-3 sm:block">
          {tab === 'packages'
            ? 'Sisa kuota diperbarui manual agar tetap akurat.'
            : 'Pembayaran langganan otomatis tercatat di Finance.'}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} variants={fadeUp} initial="hidden" animate="visible" exit="exit">
          {tab === 'packages' ? (
            <DataTab
              devices={data.devices}
              packages={data.dataPackages}
              currency={currency}
              onAddPackage={() => openPackageForm(null)}
              onEditPackage={(pkg) => openPackageForm(pkg)}
              onUpdateRemaining={setRemainingTarget}
              onAddDevice={() => setDeviceDialog({ open: true, device: null })}
              onEditDevice={(device) => setDeviceDialog({ open: true, device })}
              onDeleteDevice={(device) => setPending({ kind: 'device', device })}
              onDeletePackage={(pkg) => setPending({ kind: 'package', pkg })}
            />
          ) : (
            <SubscriptionsTab
              subscriptions={data.subscriptions}
              transactions={data.transactions}
              categories={data.categories}
              currency={currency}
              onAdd={() => setSubscriptionDialog({ open: true, subscription: null })}
              onEdit={(subscription) => setSubscriptionDialog({ open: true, subscription })}
              onPay={(subscription) => setPending({ kind: 'payment', subscription })}
              onToggle={handleToggleSubscription}
              onDelete={(subscription) => setPending({ kind: 'subscription', subscription })}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <DeviceFormModal
        open={deviceDialog.open}
        device={deviceDialog.device}
        onClose={() => setDeviceDialog({ open: false, device: null })}
      />
      <PackageFormModal
        open={packageDialog.open}
        pkg={packageDialog.pkg}
        devices={data.devices}
        currency={currency}
        onClose={() => setPackageDialog({ open: false, pkg: null })}
      />
      <RemainingQuotaModal
        open={remainingTarget !== null}
        pkg={remainingTarget}
        onClose={() => setRemainingTarget(null)}
      />
      <SubscriptionFormModal
        open={subscriptionDialog.open}
        subscription={subscriptionDialog.subscription}
        categories={data.categories}
        currency={currency}
        onClose={() => setSubscriptionDialog({ open: false, subscription: null })}
      />
      <ConfirmDialog
        open={pending !== null}
        onClose={() => {
          if (!confirmBusy) setPending(null)
        }}
        onConfirm={handleConfirm}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        tone={confirmCopy.tone}
        loading={confirmBusy}
      />
    </div>
  )
}
