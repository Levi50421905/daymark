import { useId, useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Select, Textarea, TextInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { DEVICE_META } from '@/lib/constants'
import { actions } from '@/lib/store'
import type { Device, DeviceType } from '@/types/domain'
import { errorText } from '../helpers'

interface DeviceFormModalProps {
  open: boolean
  device: Device | null
  onClose: () => void
}

const DEVICE_TYPES = Object.keys(DEVICE_META) as DeviceType[]

export function DeviceFormModal({ open, device, onClose }: DeviceFormModalProps) {
  const formId = useId().replace(/:/g, '')
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={device ? 'Edit perangkat' : 'Tambah perangkat'}
      description="Perangkat membantumu memisahkan sisa kuota per gadget."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId} icon={device ? Check : Plus} className="max-sm:min-h-11">
            {device ? 'Simpan perubahan' : 'Tambah perangkat'}
          </Button>
        </ModalFooter>
      }
    >
      <DeviceFormFields
        key={device?.id ?? 'new-device'}
        formId={formId}
        device={device}
        onClose={onClose}
      />
    </Modal>
  )
}

function DeviceFormFields({
  formId,
  device,
  onClose,
}: {
  formId: string
  device: Device | null
  onClose: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState(device?.name ?? '')
  const [type, setType] = useState<DeviceType>(device?.type ?? 'phone')
  const [note, setNote] = useState(device?.note ?? '')
  const [nameError, setNameError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Nama perangkat wajib diisi.')
      return
    }
    try {
      if (device) {
        actions.updateDevice(device.id, { name: trimmed, type, note: note.trim() })
        toast({
          tone: 'success',
          title: 'Perangkat diperbarui',
          description: `"${trimmed}" sudah disimpan.`,
        })
      } else {
        actions.addDevice({ name: trimmed, type, note: note.trim() })
        toast({
          tone: 'success',
          title: 'Perangkat ditambahkan',
          description: `"${trimmed}" siap dihubungkan dengan paket data.`,
        })
      }
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan perangkat',
        description: errorText(error),
      })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nama perangkat" htmlFor={`${formId}-name`} required error={nameError}>
        <TextInput
          id={`${formId}-name`}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (nameError) setNameError('')
          }}
          placeholder="Mis. Pixel 9, Router kamar"
          autoComplete="off"
          maxLength={40}
        />
      </Field>
      <Field
        label="Jenis perangkat"
        htmlFor={`${formId}-type`}
        required
        hint="Jenis menentukan ikon yang tampil di kartu perangkat."
      >
        <Select
          id={`${formId}-type`}
          value={type}
          onChange={(event) => setType(event.target.value as DeviceType)}
        >
          {DEVICE_TYPES.map((value) => (
            <option key={value} value={value}>
              {DEVICE_META[value].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Catatan" htmlFor={`${formId}-note`} optional>
        <Textarea
          id={`${formId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Mis. perangkat utama untuk kerja."
          rows={3}
          maxLength={160}
        />
      </Field>
    </form>
  )
}
