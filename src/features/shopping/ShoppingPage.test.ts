import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { actions, startWithoutStorage } from '@/lib/store'
import ShoppingPage from '@/features/shopping/ShoppingPage'

function renderAt(path: string): string {
  const routes = createElement(
    Routes,
    null,
    createElement(Route, { path: '/shopping', element: createElement(ShoppingPage) }),
    createElement(Route, { path: '/shopping/:listId', element: createElement(ShoppingPage) }),
  )
  return renderToString(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(ToastProvider, null, routes),
    ),
  )
}

describe('shopping module render smoke test', () => {
  it('renders the empty index state', () => {
    startWithoutStorage()
    const html = renderAt('/shopping')
    expect(html).toContain('Belum ada daftar belanja')
    expect(html).toContain('Daftar baru')
  })

  it('renders lists, detail, items, totals and linked finance state', () => {
    startWithoutStorage()
    const list = actions.addShoppingList({ name: 'Belanja Uji', note: 'Catatan uji', budget: 200000 })
    actions.addShoppingItem(list.id, {
      name: 'Telur',
      category: 'Makanan',
      qty: 2,
      unit: 'pack',
      estimatedPrice: 32000,
      actualPrice: null,
      purchased: true,
      note: 'Isi 10 butir',
    })
    actions.addShoppingItem(list.id, {
      name: 'Sabun',
      category: 'Rumah Tangga',
      qty: 1,
      unit: 'botol',
      estimatedPrice: 28000,
      actualPrice: 26500,
      purchased: false,
      note: '',
    })

    const indexHtml = renderAt('/shopping')
    expect(indexHtml).toContain('Belanja Uji')
    expect(indexHtml).toContain('Ringkasan belanja')

    const detailHtml = renderAt(`/shopping/${list.id}`)
    expect(detailHtml).toContain('Barang belanja')
    expect(detailHtml).toContain('Telur')
    expect(detailHtml).toContain('Makanan')
    expect(detailHtml).toContain('Rumah Tangga')
    expect(detailHtml).toContain('Anggaran daftar')
    expect(detailHtml).toContain('Catat ke Finance')

    const category = actions.getData().categories.find((entry) => entry.type === 'expense')
    if (!category) throw new Error('missing expense category')
    actions.recordShoppingToFinance(list.id, category.id, '2026-01-10')
    const linkedHtml = renderAt(`/shopping/${list.id}`)
    expect(linkedHtml).toContain('Tercatat di Finance')
    expect(linkedHtml).toContain('Batalkan catatan')
  })

  it('renders the not-found detail state', () => {
    startWithoutStorage()
    const html = renderAt('/shopping/tidak-ada')
    expect(html).toContain('Daftar belanja tidak ditemukan')
    expect(html).toContain('Kembali ke daftar belanja')
  })
})
