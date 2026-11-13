import { useId, useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  AmountInput,
  DateInput,
  Field,
  FormGrid,
  Select,
  Textarea,
  TextInput,
} from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { addDaysISO, todayISO } from '@/lib/dates'
import { actions } from '@/lib/store'
import type { CurrencyCode, DataPackage, Device } from '@/types/domain'
import { errorText, parseQuotaInput, quotaText } from '../helpers'

interface PackageFormModalProps {
  open: boolean
  pkg: DataPackage | null
  devices: Device[]
  currency: CurrencyCode
  onClose: () => void
}

interface PackageFormErrors {
  device?: string
  provider?: string
  price?: string
  quota?: string
  remaining?: string
  purchasedAt?: string
  expiresAt?: string
}

export function PackageFormModal({
  open,
  pkg,
  devices,
  currency,
  onClose,
}: PackageFormModalProps) {
  const formId = useId().replace(/:/g, '')
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={pkg ? 'Edit paket data' : 'Tambah paket data'}
      description="Catat pembelian kuota agar sisa dan masa aktifnya mudah dipantau."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            form={formId}
            icon={pkg ? Check : Plus}
            disabled={!devices.length}
            className="max-sm:min-h-11"
          >
            {pkg ? 'Simpan perubahan' : 'Tambah paket'}
          </Button>
        </ModalFooter>
      }
    >
      <PackageFormFields
        key={pkg?.id ?? 'new-package'}
        formId={formId}
        pkg={pkg}
        devices={devices}
        currency={currency}
        onClose={onClose}
      />
    </Modal>
  )
}

function PackageFormFields({
  formId,
  pkg,
  devices,
  currency,
  onClose,
}: {
  formId: string
  pkg: DataPackage | null
  devices: Device[]
  currency: CurrencyCode
  onClose: () => void
}) {
  const toast = useToast()
  const [deviceId, setDeviceId] = useState(pkg?.deviceId ?? devices[0]?.id ?? '')
  const [provider, setProvider] = useState(pkg?.provider ?? '')
  const [packageName, setPackageName] = useState(pkg?.packageName ?? '')
  const [price, setPrice] = useState(pkg?.price ?? 0)
  const [quota, setQuota] = useState(pkg ? String(pkg.quotaGB) : '')
  const [remaining, setRemaining] = useState(pkg ? String(pkg.remainingGB) : '')
  const [purchasedAt, setPurchasedAt] = useState(pkg?.purchasedAt ?? todayISO())
  const [expiresAt, setExpiresAt] = useState(pkg?.expiresAt ?? addDaysISO(todayISO(), 30))
  const [note, setNote] = useState(pkg?.note ?? '')
  const [errors, setErrors] = useState<PackageFormErrors>({})

  function clearError(key: keyof PackageFormErrors) {
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!devices.length) {
      setErrors({ device: 'Tambahkan perangkat terlebih dahulu.' })
      return
    }
    const quotaValue = parseQuotaInput(quota)
    const remainingValue = remaining.trim() === '' ? quotaValue : parseQuotaInput(remaining)
    const nextErrors: PackageFormErrors = {}

    if (!deviceId) nextErrors.device = 'Pilih perangkat untuk paket ini.'
    if (!provider.trim()) nextErrors.provider = 'Nama provider wajib diisi.'
    if (!Number.isFinite(price) || price <= 0) nextErrors.price = 'Harga paket harus lebih dari 0.'
    if (quotaValue === null || quotaValue <= 0) nextErrors.quota = 'Kuota harus lebih dari 0 GB.'
    if (remainingValue === null || remainingValue < 0) {
      nextErrors.remaining = 'Sisa kuota harus berupa angka 0 atau lebih.'
    } else if (quotaValue !== null && remainingValue > quotaValue) {
      nextErrors.remaining = 'Sisa kuota tidak boleh melebihi kuota.'
    }
    if (!purchasedAt) nextErrors.purchasedAt = 'Tanggal pembelian wajib diisi.'
    if (!expiresAt) nextErrors.expiresAt = 'Tanggal berakhir wajib diisi.'
    else if (purchasedAt && expiresAt < purchasedAt) {
      nextErrors.expiresAt = 'Tanggal berakhir tidak boleh sebelum tanggal pembelian.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    if (quotaValue === null || remainingValue === null) return

    const payload = {
      deviceId,
      provider: provider.trim(),
      packageName: packageName.trim(),
      price,
      quotaGB: quotaValue,
      remainingGB: remainingValue,
      purchasedAt,
      expiresAt,
      note: note.trim(),
    }

    try {
      if (pkg) {
        actions.updateDataPackage(pkg.id, payload)
        toast({
          tone: 'success',
          title: 'Paket data diperbarui',
          description: `${payload.provider} · ${quotaText(quotaValue)} tersimpan.`,
        })
      } else {
        actions.addDataPackage(payload)
        toast({
          tone: 'success',
          title: 'Paket data ditambahkan',
          description: `${payload.provider} · ${quotaText(quotaValue)} siap dipantau.`,
        })
      }
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan paket data',
        description: errorText(error),
      })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Perangkat"
        htmlFor={`${formId}-device`}
        required
        error={errors.device}
        hint={devices.length ? undefined : 'Tambahkan perangkat dulu sebelum menyimpan paket.'}
      >
        <Select
          id={`${formId}-device`}
          value={deviceId}
          onChange={(event) => {
            setDeviceId(event.target.value)
            clearError('device')
          }}
          disabled={!devices.length}
        >
          {devices.length === 0 ? <option value="">Belum ada perangkat</option> : null}
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </Select>
      </Field>

      <FormGrid>
        <Field label="Provider" htmlFor={`${formId}-provider`} required error={errors.provider}>
          <TextInput
            id={`${formId}-provider`}
            value={provider}
            onChange={(event) => {
              setProvider(event.target.value)
              clearError('provider')
            }}
            placeholder="Telkomsel, IndiHome, XL"
            autoComplete="off"
            maxLength={40}
          />
        </Field>
        <Field label="Nama paket" htmlFor={`${formId}-package`} optional>
          <TextInput
            id={`${formId}-package`}
            value={packageName}
            onChange={(event) => setPackageName(event.target.value)}
            placeholder="Internet 25 GB"
            autoComplete="off"
            maxLength={60}
          />
        </Field>
      </FormGrid>

      <FormGrid>
        <Field label="Harga paket" htmlFor={`${formId}-price`} required error={errors.price}>
          <AmountInput
            id={`${formId}-price`}
            currency={currency}
            value={price}
            onValueChange={(next) => {
              setPrice(next)
              clearError('price')
            }}
          />
        </Field>
        <Field
          label="Kuota (GB)"
          htmlFor={`${formId}-quota`}
          required
          error={errors.quota}
          hint="Total kuota paket."
        >
          <TextInput
            id={`${formId}-quota`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={quota}
            onChange={(event) => {
              setQuota(event.target.value)
              clearError('quota')
              clearError('remaining')
            }}
            placeholder="25"
          />
        </Field>
      </FormGrid>

      <Field
        label="Sisa kuota (GB)"
        htmlFor={`${formId}-remaining`}
        optional
        error={errors.remaining}
        hint="Kosongkan untuk mengisi penuh kuota. Bisa diubah kapan saja lewat Perbarui sisa."
      >
        <TextInput
          id={`${formId}-remaining`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={remaining}
          onChange={(event) => {
            setRemaining(event.target.value)
            clearError('remaining')
          }}
          placeholder={quota.trim() || '25'}
        />
      </Field>

      <FormGrid>
        <Field
          label="Tanggal beli"
          htmlFor={`${formId}-purchased`}
          required
          error={errors.purchasedAt}
        >
          <DateInput
            id={`${formId}-purchased`}
            value={purchasedAt}
            onValueChange={(next) => {
              setPurchasedAt(next)
              clearError('purchasedAt')
            }}
          />
        </Field>
        <Field
          label="Tanggal berakhir"
          htmlFor={`${formId}-expires`}
          required
          error={errors.expiresAt}
          hint="Status kuota mengikuti tanggal ini."
        >
          <DateInput
            id={`${formId}-expires`}
            value={expiresAt}
            onValueChange={(next) => {
              setExpiresAt(next)
              clearError('expiresAt')
            }}
          />
        </Field>
      </FormGrid>

      <Field label="Catatan" htmlFor={`${formId}-note`} optional>
        <Textarea
          id={`${formId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Mis. dipakai untuk hotspot kerja."
          rows={2}
          maxLength={160}
        />
      </Field>
    </form>
  )
}
