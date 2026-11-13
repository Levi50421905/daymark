import { useLayoutEffect, useId, useState, type FormEvent } from 'react'
import { Check, CheckCheck, CircleDashed } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, FormActions, FormGrid, Select, TextInput, Textarea, DateInput } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { PRIORITY_META } from '@/lib/constants'
import { addDaysISO, todayISO } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { actions } from '@/lib/store'
import type { Checklist, Priority, Task, TaskStatus } from '@/types/domain'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  task: Task | null
  checklists: Checklist[]
  categories: string[]
  defaultDate?: string | null
  defaultChecklistId?: string | null
}

export function TaskFormModal({
  open,
  onClose,
  task,
  checklists,
  categories,
  defaultDate,
  defaultChecklistId,
}: TaskFormModalProps) {
  const toast = useToast()
  const titleId = useId()
  const notesId = useId()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [category, setCategory] = useState('Personal')
  const [dueDate, setDueDate] = useState('')
  const [checklistId, setChecklistId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const editing = Boolean(task)

  useLayoutEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setNotes(task?.notes ?? '')
    setPriority(task?.priority ?? 'medium')
    setStatus(task?.status ?? 'todo')
    setCategory(task?.category ?? categories[0] ?? 'Personal')
    setDueDate(task?.dueDate ?? defaultDate ?? '')
    setChecklistId(task?.checklistId ?? defaultChecklistId ?? '')
    setError(null)
  }, [open, task, defaultDate, defaultChecklistId, categories])

  const today = todayISO()
  const tomorrow = addDaysISO(today, 1)
  const nextWeek = addDaysISO(today, 7)

  const quickDates: Array<{ label: string; value: string }> = [
    { label: 'Hari ini', value: today },
    { label: 'Besok', value: tomorrow },
    { label: 'Minggu depan', value: nextWeek },
  ]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Judul tugas wajib diisi.')
      return
    }
    setError(null)
    const payload = {
      title: cleanTitle,
      notes,
      priority,
      category: category.trim() || 'Personal',
      dueDate: dueDate || null,
      checklistId: checklistId || null,
      status,
    }
    try {
      if (task) {
        actions.updateTask(task.id, payload)
        toast({ tone: 'success', title: 'Tugas diperbarui', description: cleanTitle })
      } else {
        actions.addTask(payload)
        toast({ tone: 'success', title: 'Tugas ditambahkan', description: cleanTitle })
      }
      onClose()
    } catch (submitError) {
      toast({
        tone: 'error',
        title: editing ? 'Gagal memperbarui tugas' : 'Gagal menambah tugas',
        description: submitError instanceof Error ? submitError.message : 'Terjadi kesalahan.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? 'Edit tugas' : 'Tugas baru'}
      description={
        editing
          ? 'Perbarui detail, prioritas, atau tenggat tugas ini.'
          : 'Tulis satu langkah yang jelas supaya mudah dimulai.'
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <Field label="Judul tugas" htmlFor={titleId} required error={error ?? undefined}>
            <TextInput
              id={titleId}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (error) setError(null)
              }}
              placeholder="Contoh: Bayar tagihan listrik"
              maxLength={140}
              aria-invalid={error ? true : undefined}
              className={error ? 'field-invalid' : undefined}
            />
          </Field>

          <FormGrid>
            <Field label="Prioritas">
              <div role="group" aria-label="Prioritas tugas" className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as const).map((value) => {
                  const meta = PRIORITY_META[value]
                  const active = priority === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      aria-pressed={active}
                      className={cn(
                        'focus-ring inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition-colors',
                        active ? 'text-ink' : 'border-line bg-surface-2 text-ink-3 hover:text-ink',
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: `color-mix(in srgb, ${meta.color} 13%, var(--c-surface))`,
                              borderColor: `color-mix(in srgb, ${meta.color} 45%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                        aria-hidden="true"
                      />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Status">
              <SegmentedControl<TaskStatus>
                value={status}
                onChange={setStatus}
                ariaLabel="Status tugas"
                className="w-full"
                options={[
                  { value: 'todo', label: 'Aktif', icon: CircleDashed },
                  { value: 'done', label: 'Selesai', icon: CheckCheck },
                ]}
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Kategori aktivitas" htmlFor="task-category">
              <Select
                id="task-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Checklist"
              htmlFor="task-checklist"
              hint={checklists.length === 0 ? 'Belum ada checklist. Buat dari tombol Checklist baru.' : undefined}
            >
              <Select
                id="task-checklist"
                value={checklistId}
                onChange={(event) => setChecklistId(event.target.value)}
              >
                <option value="">Tanpa checklist</option>
                {checklists.map((checklist) => (
                  <option key={checklist.id} value={checklist.id}>
                    {checklist.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>

          <Field label="Tenggat" optional hint="Kosongkan jika tugas ini belum punya tanggal.">
            <div className="space-y-2">
              <DateInput value={dueDate} onValueChange={setDueDate} />
              <div className="flex flex-wrap items-center gap-1.5">
                {quickDates.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setDueDate(option.value)}
                    aria-pressed={dueDate === option.value}
                    className={cn(
                      'focus-ring inline-flex h-8 items-center rounded-full border px-2.5 text-[0.6875rem] font-semibold transition-colors',
                      dueDate === option.value
                        ? 'border-brand/35 bg-brand/10 text-brand'
                        : 'border-line bg-surface-2 text-ink-3 hover:border-line-strong hover:text-ink-2',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                {dueDate ? (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="focus-ring inline-flex h-8 items-center rounded-full border border-line px-2.5 text-[0.6875rem] font-semibold text-ink-3 transition-colors hover:border-danger/30 hover:text-danger"
                  >
                    Tanpa tenggat
                  </button>
                ) : null}
              </div>
            </div>
          </Field>

          <Field label="Catatan" htmlFor={notesId} optional>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detail kecil, langkah pertama, atau pengingat…"
              rows={3}
            />
          </Field>
        </div>

        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" icon={Check}>
            {editing ? 'Simpan perubahan' : 'Simpan tugas'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
