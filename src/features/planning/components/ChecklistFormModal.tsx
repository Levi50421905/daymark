import { useLayoutEffect, useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { Field, FormActions, TextInput } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { CHECKLIST_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { actions } from '@/lib/store'
import { CHECKLIST_ICON_CHOICES } from '@/features/planning/planning-helpers'
import type { Checklist } from '@/types/domain'

interface ChecklistFormModalProps {
  open: boolean
  onClose: () => void
  checklist: Checklist | null
  taskCount: number
  onSaved: (checklist: Checklist) => void
}

export function ChecklistFormModal({
  open,
  onClose,
  checklist,
  taskCount,
  onSaved,
}: ChecklistFormModalProps) {
  const toast = useToast()
  const nameId = useId()
  const [name, setName] = useState('')
  const [color, setColor] = useState(CHECKLIST_COLORS[0] ?? '#2EC4B6')
  const [icon, setIcon] = useState<string>(CHECKLIST_ICON_CHOICES[0])
  const [error, setError] = useState<string | null>(null)

  const editing = Boolean(checklist)

  useLayoutEffect(() => {
    if (!open) return
    setName(checklist?.name ?? '')
    setColor(checklist?.color ?? CHECKLIST_COLORS[0] ?? '#2EC4B6')
    setIcon(checklist?.icon ?? CHECKLIST_ICON_CHOICES[0])
    setError(null)
  }, [open, checklist])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) {
      setError('Nama checklist wajib diisi.')
      return
    }
    setError(null)
    try {
      if (checklist) {
        actions.updateChecklist(checklist.id, { name: cleanName, color, icon })
        toast({ tone: 'success', title: 'Checklist diperbarui', description: cleanName })
        onSaved({ ...checklist, name: cleanName, color, icon })
      } else {
        const created = actions.addChecklist({ name: cleanName, color, icon })
        toast({ tone: 'success', title: 'Checklist dibuat', description: cleanName })
        onSaved(created)
      }
      onClose()
    } catch (submitError) {
      toast({
        tone: 'error',
        title: editing ? 'Gagal memperbarui checklist' : 'Gagal membuat checklist',
        description: submitError instanceof Error ? submitError.message : 'Terjadi kesalahan.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? 'Edit checklist' : 'Checklist baru'}
      description="Beri nama, warna, dan ikon supaya mudah dikenali."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          <Field label="Nama checklist" htmlFor={nameId} required error={error ?? undefined}>
            <TextInput
              id={nameId}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError(null)
              }}
              placeholder="Contoh: Rutinitas Pagi"
              maxLength={60}
              aria-invalid={error ? true : undefined}
              className={error ? 'field-invalid' : undefined}
            />
          </Field>

          <div className="surface-muted flex items-center gap-3 p-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border"
              style={{
                color,
                backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`,
                borderColor: `color-mix(in srgb, ${color} 26%, transparent)`,
              }}
              aria-hidden="true"
            >
              <DynamicIcon name={icon} size={20} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{name.trim() || 'Checklist baru'}</p>
              <p className="mt-0.5 text-[0.6875rem] font-medium text-ink-3">
                {editing ? `${taskCount} tugas dalam checklist ini` : 'Pratinjau tampilan checklist'}
              </p>
            </div>
          </div>

          <Field label="Warna">
            <div role="group" aria-label="Warna checklist" className="flex flex-wrap gap-2">
              {CHECKLIST_COLORS.map((option) => {
                const active = color === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    aria-label={`Warna ${option}`}
                    aria-pressed={active}
                    className={cn(
                      'focus-ring flex h-11 w-11 items-center justify-center rounded-[13px] border-2 transition-transform',
                      active ? 'scale-105 border-ink/25' : 'border-transparent hover:scale-105',
                    )}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${option} 16%, var(--c-surface))`,
                      borderColor: active ? option : undefined,
                    }}
                  >
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: option }}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Ikon">
            <div role="group" aria-label="Ikon checklist" className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {CHECKLIST_ICON_CHOICES.map((option) => {
                const active = icon === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setIcon(option)}
                    aria-label={`Ikon ${option}`}
                    aria-pressed={active}
                    className={cn(
                      'focus-ring flex h-10 items-center justify-center rounded-[11px] border transition-colors',
                      active ? 'text-ink' : 'border-line bg-surface-2 text-ink-3 hover:text-ink',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `color-mix(in srgb, ${color} 14%, var(--c-surface))`,
                            borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                            color,
                          }
                        : undefined
                    }
                  >
                    <DynamicIcon name={option} size={17} strokeWidth={1.9} />
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" icon={Check}>
            {editing ? 'Simpan perubahan' : 'Buat checklist'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
