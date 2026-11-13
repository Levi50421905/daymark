import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, Info, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, TextInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { CATEGORY_COLORS, CATEGORY_ICON_CHOICES } from '@/lib/constants'
import { actions } from '@/lib/store'
import type { AppData, Category, TransactionType } from '@/types/domain'
import { categoryUsageLabel, getCategoryUsage } from './finance-utils'
import { ColorPicker, IconPicker } from './Pickers'

interface CategoryEditorState {
  mode: 'create' | 'edit'
  id: string | null
  type: TransactionType
  name: string
  color: string
  icon: string
}

interface CategoryManagerModalProps {
  open: boolean
  onClose: () => void
  data: AppData
  initialType?: TransactionType
}

const TYPE_LABEL: Record<TransactionType, string> = {
  income: 'pemasukan',
  expense: 'pengeluaran',
}

export function CategoryManagerModal({
  open,
  onClose,
  data,
  initialType = 'expense',
}: CategoryManagerModalProps) {
  const toast = useToast()
  const [activeType, setActiveType] = useState<TransactionType>(initialType)
  const [editor, setEditor] = useState<CategoryEditorState | null>(null)
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setActiveType(initialType)
    setEditor(null)
    setErrors({})
    setPendingDeleteId(null)
  }, [open, initialType])

  const list = useMemo(
    () => data.categories.filter((category) => category.type === activeType),
    [data.categories, activeType],
  )
  const incomeCount = data.categories.filter((category) => category.type === 'income').length
  const expenseCount = data.categories.filter((category) => category.type === 'expense').length

  const openCreate = () => {
    setEditor({
      mode: 'create',
      id: null,
      type: activeType,
      name: '',
      color: CATEGORY_COLORS[0],
      icon: CATEGORY_ICON_CHOICES[0],
    })
    setErrors({})
    setPendingDeleteId(null)
  }

  const openEdit = (category: Category) => {
    setEditor({
      mode: 'edit',
      id: category.id,
      type: category.type,
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
    setErrors({})
    setPendingDeleteId(null)
  }

  const handleTypeChange = (type: TransactionType) => {
    setActiveType(type)
    setEditor(null)
    setErrors({})
    setPendingDeleteId(null)
  }

  const handleSave = () => {
    if (!editor) return
    const name = editor.name.trim()
    if (!name) {
      setErrors({ name: 'Nama kategori wajib diisi.' })
      return
    }
    try {
      if (editor.mode === 'edit' && editor.id) {
        actions.updateCategory(editor.id, { name, color: editor.color, icon: editor.icon })
        toast({ tone: 'success', title: 'Kategori diperbarui', description: name })
      } else {
        actions.addCategory({ name, type: editor.type, color: editor.color, icon: editor.icon })
        setActiveType(editor.type)
        toast({ tone: 'success', title: 'Kategori ditambahkan', description: `${name} siap dipakai.` })
      }
      setEditor(null)
      setErrors({})
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'
      setErrors({ name: message })
      toast({ tone: 'error', title: 'Gagal menyimpan kategori', description: message })
    }
  }

  const handleDelete = (category: Category) => {
    try {
      actions.deleteCategory(category.id)
      toast({ tone: 'success', title: 'Kategori dihapus', description: `${category.name} sudah dihapus.` })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menghapus kategori',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Kelola kategori"
      description="Rapikan kategori pemasukan dan pengeluaran. Warna dan ikon membantu kamu membaca ke mana uang pergi."
      footer={
        <ModalFooter>
          <Button onClick={onClose}>Selesai</Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            value={activeType}
            onChange={handleTypeChange}
            size="sm"
            ariaLabel="Jenis kategori"
            options={[
              { value: 'expense', label: 'Pengeluaran', icon: ArrowUpRight, count: expenseCount },
              { value: 'income', label: 'Pemasukan', icon: ArrowDownLeft, count: incomeCount },
            ]}
          />
          <p className="text-[0.6875rem] font-semibold text-ink-3">
            {list.length} kategori {TYPE_LABEL[activeType]}
          </p>
        </div>

        {editor ? (
          <div className="surface-muted space-y-3 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink">
                {editor.mode === 'edit' ? 'Ubah kategori' : 'Kategori baru'}
              </p>
              <IconButton
                label="Tutup editor kategori"
                icon={X}
                size="sm"
                onClick={() => {
                  setEditor(null)
                  setErrors({})
                }}
              />
            </div>
            <Field label="Nama kategori" htmlFor="finance-category-name" required error={errors.name}>
              <TextInput
                id="finance-category-name"
                value={editor.name}
                maxLength={40}
                placeholder="Contoh: Kopi pagi"
                onChange={(event) => {
                  setEditor({ ...editor, name: event.target.value })
                  setErrors({})
                }}
              />
            </Field>
            {editor.mode === 'create' ? (
              <Field label="Jenis kategori" hint="Jenis tidak bisa diubah setelah kategori dibuat.">
                <SegmentedControl
                  value={editor.type}
                  onChange={(type) => setEditor({ ...editor, type })}
                  size="sm"
                  ariaLabel="Jenis kategori baru"
                  options={[
                    { value: 'expense', label: 'Pengeluaran', icon: ArrowUpRight },
                    { value: 'income', label: 'Pemasukan', icon: ArrowDownLeft },
                  ]}
                />
              </Field>
            ) : null}
            <Field label="Warna" hint="Warna ini muncul di grafik dan ikon kategori.">
              <ColorPicker
                colors={CATEGORY_COLORS}
                value={editor.color}
                onChange={(color) => setEditor({ ...editor, color })}
              />
            </Field>
            <Field label="Ikon">
              <IconPicker
                icons={CATEGORY_ICON_CHOICES}
                value={editor.icon}
                labelPrefix="ikon kategori"
                onChange={(icon) => setEditor({ ...editor, icon })}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button size="sm" icon={Check} onClick={handleSave}>
                {editor.mode === 'edit' ? 'Simpan perubahan' : 'Simpan kategori'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditor(null)
                  setErrors({})
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" icon={Plus} onClick={openCreate} className="w-full">
            Tambah kategori {TYPE_LABEL[activeType]}
          </Button>
        )}

        <p className="flex items-start gap-1.5 text-[0.6875rem] leading-relaxed text-ink-3">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Kategori yang masih dipakai transaksi atau anggaran tidak bisa dihapus. Pindahkan datanya
          dulu agar riwayatmu tetap utuh.
        </p>

        {list.length === 0 ? (
          <EmptyState
            compact
            icon={Tag}
            title={`Belum ada kategori ${TYPE_LABEL[activeType]}`}
            description="Tambahkan kategori pertama supaya transaksi bisa dicatat dengan rapi."
            action={
              <Button size="sm" variant="soft" icon={Plus} onClick={openCreate}>
                Tambah kategori
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {list.map((category) => {
              const usage = getCategoryUsage(data, category.id)
              const confirming = pendingDeleteId === category.id
              return (
                <li key={category.id} className="surface-muted p-2.5">
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon icon={category.icon} color={category.color} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink">{category.name}</p>
                      <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">
                        {categoryUsageLabel(usage)}
                      </p>
                    </div>
                    <IconButton
                      label={`Ubah kategori ${category.name}`}
                      icon={Pencil}
                      size="sm"
                      onClick={() => openEdit(category)}
                    />
                    <IconButton
                      label={
                        usage.inUse
                          ? `${category.name} masih dipakai`
                          : `Hapus kategori ${category.name}`
                      }
                      icon={Trash2}
                      size="sm"
                      variant="danger"
                      disabled={usage.inUse}
                      onClick={() => setPendingDeleteId(category.id)}
                    />
                  </div>
                  {usage.inUse ? (
                    <p className="mt-1.5 pl-12 text-[0.625rem] leading-relaxed text-ink-3">
                      Pindahkan atau hapus transaksi dan anggaran yang memakai kategori ini dulu.
                    </p>
                  ) : null}
                  {confirming ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/20 bg-danger/10 p-2">
                      <p className="text-[0.6875rem] font-semibold text-danger">
                        Hapus kategori “{category.name}”?
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)}>
                          Batal
                        </Button>
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(category)}>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
