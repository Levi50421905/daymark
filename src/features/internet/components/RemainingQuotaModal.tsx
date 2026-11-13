import { useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { CircularProgress } from '@/components/charts/DonutChart'
import { actions } from '@/lib/store'
import type { DataPackage } from '@/types/domain'
import { errorText, parseQuotaInput, quotaText } from '../helpers'

interface RemainingQuotaModalProps {
  open: boolean
  pkg: DataPackage | null
  onClose: () => void
}

export function RemainingQuotaModal({ open, pkg, onClose }: RemainingQuotaModalProps) {
  const formId = useId().replace(/:/g, '')
  return (
    <Modal
      open={open && pkg !== null}
      onClose={onClose}
      size="sm"
      title="Perbarui sisa kuota"
      description={
        pkg
          ? `${pkg.provider}${pkg.packageName ? ` · ${pkg.packageName}` : ''} · kuota ${quotaText(
              pkg.quotaGB,
            )}`
          : undefined
      }
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId} icon={Check} disabled={!pkg} className="max-sm:min-h-11">
            Simpan sisa
          </Button>
        </ModalFooter>
      }
    >
      {pkg ? (
        <RemainingQuotaFields key={pkg.id} formId={formId} pkg={pkg} onClose={onClose} />
      ) : null}
    </Modal>
  )
}

function RemainingQuotaFields({
  formId,
  pkg,
  onClose,
}: {
  formId: string
  pkg: DataPackage
  onClose: () => void
}) {
  const toast = useToast()
  const [value, setValue] = useState(String(pkg.remainingGB))
  const [error, setError] = useState('')
  const parsed = parseQuotaInput(value)
  const percent =
    parsed !== null && pkg.quotaGB > 0
      ? Math.min(100, Math.max(0, (parsed / pkg.quotaGB) * 100))
      : 0
  const presets =
    pkg.quotaGB > 0
      ? [
          { label: 'Habis', value: 0 },
          { label: 'Setengah', value: Math.round((pkg.quotaGB / 2) * 10) / 10 },
          { label: 'Penuh', value: pkg.quotaGB },
        ]
      : []

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = parseQuotaInput(value)
    if (next === null || next < 0) {
      setError('Sisa kuota harus berupa angka 0 atau lebih.')
      return
    }
    if (pkg.quotaGB > 0 && next > pkg.quotaGB) {
      setError(`Sisa kuota tidak boleh melebihi ${quotaText(pkg.quotaGB)}.`)
      return
    }
    try {
      actions.updateRemainingQuota(pkg.id, next)
      toast({
        tone: 'success',
        title: 'Sisa kuota diperbarui',
        description: `${quotaText(next)} tersisa untuk ${pkg.provider}${
          pkg.packageName ? ` · ${pkg.packageName}` : ''
        }.`,
      })
      onClose()
    } catch (submitError) {
      toast({
        tone: 'error',
        title: 'Gagal memperbarui kuota',
        description: errorText(submitError),
      })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
        <CircularProgress
          value={percent}
          size={76}
          strokeWidth={7}
          color={percent <= 12 ? 'var(--c-warning)' : 'var(--c-brand)'}
          ariaLabel={`Sisa kuota ${Math.round(percent)}%`}
        >
          <span className="number text-sm font-extrabold text-ink">{Math.round(percent)}%</span>
        </CircularProgress>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold text-ink-3">Sisa saat ini</p>
          <p className="number text-lg font-extrabold text-ink">{quotaText(pkg.remainingGB)}</p>
          <p className="mt-0.5 text-[0.625rem] text-ink-3">dari total {quotaText(pkg.quotaGB)}</p>
        </div>
      </div>
      <Field
        label="Sisa kuota (GB)"
        htmlFor={`${formId}-remaining`}
        required
        error={error}
        hint="Pakai desimal bila perlu, mis. 1,5. Isi 0 jika kuota benar-benar habis."
      >
        <TextInput
          id={`${formId}-remaining`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            if (error) setError('')
          }}
          placeholder="0"
          autoFocus
        />
      </Field>
      {presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setValue(String(preset.value))
                setError('')
              }}
              className="max-sm:min-h-11"
            >
              {preset.label} · {quotaText(preset.value)}
            </Button>
          ))}
        </div>
      ) : null}
    </form>
  )
}
