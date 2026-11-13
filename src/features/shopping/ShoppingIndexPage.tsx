import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Plus, ShoppingBasket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { getShoppingOverview } from '@/lib/calc'
import { useAppData, actions } from '@/lib/store'
import { fadeUp, listItem, staggerContainer, transitions } from '@/lib/motion'
import { ListCard } from '@/features/shopping/components/ListCard'
import { ListFormModal } from '@/features/shopping/components/ListFormModal'
import { ShoppingOverviewHero } from '@/features/shopping/components/ShoppingOverviewHero'
import {
  errorMessage,
  sortShoppingListsForDisplay,
  type ShoppingListFilter,
} from '@/features/shopping/lib/shopping-helpers'
import type { ShoppingList } from '@/types/domain'

export function ShoppingIndexPage() {
  const data = useAppData()
  const navigate = useNavigate()
  const toast = useToast()
  const currency = data.settings.currency
  const [filter, setFilter] = useState<ShoppingListFilter>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingList, setEditingList] = useState<ShoppingList | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ShoppingList | null>(null)

  const sortedLists = sortShoppingListsForDisplay(data.shoppingLists)
  const activeLists = sortedLists.filter((list) => list.completedAt === null)
  const completedLists = sortedLists.filter((list) => list.completedAt !== null)
  const visibleLists =
    filter === 'active' ? activeLists : filter === 'completed' ? completedLists : sortedLists
  const overview = getShoppingOverview(data.shoppingLists)
  const hasLists = data.shoppingLists.length > 0

  const openCreate = () => {
    setEditingList(null)
    setFormKey((value) => value + 1)
    setFormOpen(true)
  }

  const openEdit = (list: ShoppingList) => {
    setEditingList(list)
    setFormKey((value) => value + 1)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingList(null)
  }

  const handleCreated = (created: ShoppingList) => {
    setFilter('active')
    navigate(`/shopping/${created.id}`)
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    try {
      actions.deleteShoppingList(target.id)
      toast({ tone: 'success', title: 'Daftar belanja dihapus', description: `“${target.name}” sudah dihapus.` })
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menghapus daftar', description: errorMessage(error) })
    }
  }

  const deleteDescription = pendingDelete
    ? `Daftar “${pendingDelete.name}” beserta ${pendingDelete.items.length} barangnya akan dihapus.${
        pendingDelete.recordedTransactionId ? ' Catatan transaksi di Finance tetap tersimpan.' : ''
      }`
    : ''

  const filterOptions: Array<{ value: ShoppingListFilter; label: string; count: number }> = [
    { value: 'active', label: 'Aktif', count: overview.activeCount },
    { value: 'completed', label: 'Selesai', count: overview.completedCount },
    { value: 'all', label: 'Semua', count: data.shoppingLists.length },
  ]

  const filteredEmpty =
    filter === 'completed'
      ? {
          icon: CheckCircle2,
          title: 'Belum ada daftar selesai',
          description: 'Selesaikan salah satu daftar aktif dan daftar itu akan muncul di sini.',
        }
      : {
          icon: ShoppingBasket,
          title: 'Tidak ada daftar aktif',
          description: 'Semua daftar sudah selesai. Buat daftar baru untuk belanja berikutnya.',
        }

  return (
    <div>
      <PageHeader
        eyebrow="Shopping"
        title="Daftar belanja"
        description="Susun daftar, bandingkan estimasi dengan harga aktual, dan catat totalnya ke Finance."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Daftar baru
          </Button>
        }
      />

      {!hasLists ? (
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Card padding="none" className="hero-gradient">
            <EmptyState
              icon={ShoppingBasket}
              title="Belum ada daftar belanja"
              description="Mulai satu daftar mingguan atau daftar kecil untuk kebutuhan hari ini. Tambahkan barang, atur estimasi, lalu catat totalnya ke Finance."
              action={<Button icon={Plus} onClick={openCreate}>Buat daftar pertama</Button>}
            />
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
          className="space-y-5 sm:space-y-6"
        >
          {overview.activeCount > 0 ? (
            <ShoppingOverviewHero lists={data.shoppingLists} currency={currency} />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              options={filterOptions}
              ariaLabel="Filter daftar belanja"
            />
            <p className="text-[0.6875rem] font-medium text-ink-3">
              {visibleLists.length} daftar ditampilkan
            </p>
          </div>

          {visibleLists.length === 0 ? (
            <motion.div variants={fadeUp}>
              <Card padding="none">
                <EmptyState
                  compact
                  icon={filteredEmpty.icon}
                  title={filteredEmpty.title}
                  description={filteredEmpty.description}
                  action={
                    filter === 'completed' ? undefined : (
                      <Button icon={Plus} size="sm" onClick={openCreate}>
                        Daftar baru
                      </Button>
                    )
                  }
                />
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visibleLists.map((list) => (
                  <motion.div
                    key={list.id}
                    variants={listItem}
                    exit={{ opacity: 0, y: 8, scale: 0.98, transition: transitions.fast }}
                    className="h-full"
                  >
                    <ListCard
                      list={list}
                      currency={currency}
                      onOpen={() => navigate(`/shopping/${list.id}`)}
                      onEdit={() => openEdit(list)}
                      onDelete={() => setPendingDelete(list)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      <ListFormModal
        key={formKey}
        open={formOpen}
        list={editingList}
        currency={currency}
        onClose={closeForm}
        onCreated={handleCreated}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus daftar belanja?"
        description={deleteDescription}
        confirmLabel="Hapus daftar"
      />
    </div>
  )
}
