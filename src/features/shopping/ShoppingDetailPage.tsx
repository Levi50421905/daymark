import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Pencil, Plus, ShoppingBasket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { getShoppingTotals } from '@/lib/calc'
import { useAppData, actions } from '@/lib/store'
import { fadeUp } from '@/lib/motion'
import { CategoryBreakdownCard } from '@/features/shopping/components/CategoryBreakdownCard'
import { CategoryGroupCard } from '@/features/shopping/components/CategoryGroupCard'
import { ItemFormModal } from '@/features/shopping/components/ItemFormModal'
import { ListActionsCard } from '@/features/shopping/components/ListActionsCard'
import { ListFormModal } from '@/features/shopping/components/ListFormModal'
import { ListSummaryCard } from '@/features/shopping/components/ListSummaryCard'
import { RecordToFinanceModal } from '@/features/shopping/components/RecordToFinanceModal'
import { errorMessage, groupShoppingItems } from '@/features/shopping/lib/shopping-helpers'
import type { ShoppingItem } from '@/types/domain'

type ConfirmState =
  | { kind: 'delete-item'; item: ShoppingItem }
  | { kind: 'delete-list' }
  | { kind: 'complete' }
  | { kind: 'unlink' }

interface ShoppingDetailPageProps {
  listId: string
}

export function ShoppingDetailPage({ listId }: ShoppingDetailPageProps) {
  const data = useAppData()
  const navigate = useNavigate()
  const toast = useToast()
  const currency = data.settings.currency
  const [listFormOpen, setListFormOpen] = useState(false)
  const [listFormKey, setListFormKey] = useState(0)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [itemFormKey, setItemFormKey] = useState(0)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordKey, setRecordKey] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const list = data.shoppingLists.find((candidate) => candidate.id === listId)

  if (!list) {
    return (
      <div>
        <PageHeader
          eyebrow="Shopping"
          title="Daftar tidak ditemukan"
          description="Daftar belanja ini mungkin sudah dihapus dari perangkat ini."
          leading={
            <Link
              to="/shopping"
              className="focus-ring mb-2 inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              <ChevronLeft size={15} aria-hidden="true" />
              Semua daftar belanja
            </Link>
          }
        />
        <Card padding="none">
          <EmptyState
            icon={ShoppingBasket}
            title="Daftar belanja tidak ditemukan"
            description="Daftar mungkin sudah dihapus atau tautannya tidak lagi berlaku."
            action={<Button onClick={() => navigate('/shopping')}>Kembali ke daftar belanja</Button>}
          />
        </Card>
      </div>
    )
  }

  const totals = getShoppingTotals(list)
  const groups = groupShoppingItems(list)
  const completed = list.completedAt !== null
  const allPurchased = totals.itemCount > 0 && totals.purchasedCount === totals.itemCount
  const linkedTransaction = list.recordedTransactionId
    ? (data.transactions.find((transaction) => transaction.id === list.recordedTransactionId) ?? null)
    : null
  const linkedCategory = linkedTransaction
    ? (data.categories.find((category) => category.id === linkedTransaction.categoryId) ?? null)
    : null

  const openListForm = () => {
    setListFormKey((value) => value + 1)
    setListFormOpen(true)
  }

  const openItemCreate = () => {
    setEditingItem(null)
    setItemFormKey((value) => value + 1)
    setItemFormOpen(true)
  }

  const openItemEdit = (item: ShoppingItem) => {
    setEditingItem(item)
    setItemFormKey((value) => value + 1)
    setItemFormOpen(true)
  }

  const closeItemForm = () => {
    setItemFormOpen(false)
    setEditingItem(null)
  }

  const openRecord = () => {
    setRecordKey((value) => value + 1)
    setRecordOpen(true)
  }

  const deleteItem = (item: ShoppingItem) => {
    try {
      actions.deleteShoppingItem(list.id, item.id)
      toast({ tone: 'success', title: 'Barang dihapus', description: `“${item.name}” sudah dihapus dari daftar.` })
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menghapus barang', description: errorMessage(error) })
    }
  }

  const deleteList = () => {
    const name = list.name
    try {
      actions.deleteShoppingList(list.id)
      navigate('/shopping')
      toast({ tone: 'success', title: 'Daftar belanja dihapus', description: `“${name}” sudah dihapus.` })
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menghapus daftar', description: errorMessage(error) })
    }
  }

  const completeList = () => {
    try {
      actions.completeShoppingList(list.id)
      toast({
        tone: 'success',
        title: 'Belanja selesai',
        description: 'Daftar ditandai selesai. Catat ke Finance untuk menyimpan pengeluarannya.',
      })
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menyelesaikan daftar', description: errorMessage(error) })
    }
  }

  const unlinkFinance = () => {
    try {
      actions.unlinkShoppingTransaction(list.id)
      toast({
        tone: 'success',
        title: 'Catatan Finance dibatalkan',
        description: 'Transaksi pengeluaran terkait sudah dihapus. Daftar belanja tetap tersimpan.',
      })
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal membatalkan catatan', description: errorMessage(error) })
    }
  }

  const toggleAll = () => {
    const nextPurchased = !allPurchased
    const previousState = list.items.map((item) => ({
      id: item.id,
      purchased: item.purchased,
      actualPrice: item.actualPrice,
    }))
    try {
      actions.setAllShoppingItemsPurchased(list.id, nextPurchased)
      toast({
        tone: 'success',
        title: nextPurchased ? 'Semua barang ditandai dibeli' : 'Semua tanda dibatalkan',
        description: nextPurchased
          ? 'Harga aktual yang kosong otomatis diisi dari estimasi.'
          : 'Barang kembali masuk daftar yang perlu dibeli.',
        action: nextPurchased
          ? {
              label: 'Batalkan',
              onClick: () => {
                for (const previous of previousState) {
                  actions.updateShoppingItem(list.id, previous.id, {
                    purchased: previous.purchased,
                    actualPrice: previous.actualPrice,
                  })
                }
              },
            }
          : undefined,
      })
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal memperbarui barang', description: errorMessage(error) })
    }
  }

  const requestComplete = () => {
    if (totals.remainingCount > 0) {
      setConfirm({ kind: 'complete' })
      return
    }
    completeList()
  }

  const confirmCopy = (() => {
    if (!confirm) return null
    switch (confirm.kind) {
      case 'delete-item':
        return {
          title: 'Hapus barang?',
          description: `“${confirm.item.name}” akan dihapus dari daftar ini.`,
          confirmLabel: 'Hapus barang',
          tone: 'danger' as const,
        }
      case 'delete-list':
        return {
          title: 'Hapus daftar belanja?',
          description: `Daftar “${list.name}” beserta ${list.items.length} barangnya akan dihapus.${
            list.recordedTransactionId ? ' Catatan transaksi di Finance tetap tersimpan.' : ''
          }`,
          confirmLabel: 'Hapus daftar',
          tone: 'danger' as const,
        }
      case 'complete':
        return {
          title: 'Selesaikan belanja?',
          description: `${totals.remainingCount} barang belum ditandai dibeli. Kamu tetap bisa menyelesaikan daftar lalu membukanya kembali nanti.`,
          confirmLabel: 'Selesaikan',
          tone: 'primary' as const,
        }
      case 'unlink':
        return {
          title: 'Batalkan catatan Finance?',
          description:
            'Transaksi pengeluaran yang dibuat dari daftar ini akan dihapus dari Finance. Daftar belanja tetap tersimpan.',
          confirmLabel: 'Batalkan catatan',
          tone: 'danger' as const,
        }
    }
  })()

  const handleConfirm = () => {
    if (!confirm) return
    const next = confirm
    setConfirm(null)
    switch (next.kind) {
      case 'delete-item':
        deleteItem(next.item)
        break
      case 'delete-list':
        deleteList()
        break
      case 'complete':
        completeList()
        break
      case 'unlink':
        unlinkFinance()
        break
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shopping"
        title={list.name}
        description={list.note || 'Atur barang, harga estimasi, dan harga aktual belanja ini.'}
        leading={
          <Link
            to="/shopping"
            className="focus-ring mb-2 inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-ink-3 transition-colors hover:text-ink"
          >
            <ChevronLeft size={15} aria-hidden="true" />
            Semua daftar belanja
          </Link>
        }
        actions={
          <>
            <Button variant="secondary" icon={Pencil} onClick={openListForm}>
              Ubah daftar
            </Button>
            <Button icon={Plus} onClick={openItemCreate}>
              Tambah barang
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="order-1 min-w-0 lg:col-start-1 lg:row-start-1"
        >
          <ListSummaryCard list={list} currency={currency} onEditList={openListForm} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.04 }}
          className="order-2 min-w-0 lg:col-start-2 lg:row-start-1"
        >
          <ListActionsCard
            list={list}
            currency={currency}
            linkedTransaction={linkedTransaction}
            linkedCategory={linkedCategory}
            onRecord={openRecord}
            onUnlink={() => setConfirm({ kind: 'unlink' })}
            onToggleAll={toggleAll}
            onComplete={requestComplete}
            onReopen={() => {
              try {
                actions.reopenShoppingList(list.id)
                toast({ tone: 'success', title: 'Daftar dibuka kembali', description: 'Daftar ini aktif lagi dan bisa dilanjutkan.' })
              } catch (error) {
                toast({ tone: 'error', title: 'Gagal membuka daftar', description: errorMessage(error) })
              }
            }}
            onDelete={() => setConfirm({ kind: 'delete-list' })}
          />
        </motion.div>

        <div className="order-3 min-w-0 space-y-4 lg:col-start-1 lg:row-start-2">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-[-0.02em] text-ink">Barang belanja</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-3">
                {totals.itemCount === 0
                  ? 'Belum ada barang yang ditambahkan.'
                  : `${totals.itemCount} barang dalam ${groups.length} kategori · ${totals.purchasedCount} sudah dibeli`}
              </p>
            </div>
            <Button variant="soft" size="sm" icon={Plus} onClick={openItemCreate}>
              Barang baru
            </Button>
          </div>

          {groups.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={ShoppingBasket}
                title="Daftar ini masih kosong"
                description="Tambahkan barang dengan kategori, jumlah, dan estimasi harga. Total belanja akan dihitung otomatis."
                action={<Button icon={Plus} onClick={openItemCreate}>Tambah barang pertama</Button>}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <CategoryGroupCard
                  key={group.category}
                  group={group}
                  currency={currency}
                  onToggle={(item) => {
                    try {
                      actions.toggleShoppingItem(list.id, item.id)
                    } catch (error) {
                      toast({ tone: 'error', title: 'Gagal memperbarui barang', description: errorMessage(error) })
                    }
                  }}
                  onEdit={openItemEdit}
                  onDelete={(item) => setConfirm({ kind: 'delete-item', item })}
                />
              ))}
            </div>
          )}
        </div>

        <div className="order-4 min-w-0 space-y-4 lg:col-start-2 lg:row-start-2">
          <CategoryBreakdownCard groups={groups} currency={currency} />
          {completed ? (
            <Card padding="sm" className="border-mint/30 bg-mint/5">
              <p className="text-xs font-bold text-ink">Belanja selesai</p>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
                {list.recordedTransactionId
                  ? 'Daftar sudah selesai dan tercatat di Finance.'
                  : 'Daftar sudah selesai. Catat ke Finance agar pengeluarannya tersimpan.'}
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      <ListFormModal
        key={`list-${listFormKey}`}
        open={listFormOpen}
        list={list}
        currency={currency}
        onClose={() => setListFormOpen(false)}
      />
      <ItemFormModal
        key={`item-${itemFormKey}`}
        open={itemFormOpen}
        listId={list.id}
        listName={list.name}
        item={editingItem}
        currency={currency}
        onClose={closeItemForm}
      />
      <RecordToFinanceModal
        key={`record-${recordKey}`}
        open={recordOpen}
        list={list}
        currency={currency}
        categories={data.categories}
        onClose={() => setRecordOpen(false)}
      />
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirmCopy?.title ?? ''}
        description={confirmCopy?.description ?? ''}
        confirmLabel={confirmCopy?.confirmLabel}
        tone={confirmCopy?.tone ?? 'danger'}
      />
    </div>
  )
}
