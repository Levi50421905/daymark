import { expect, test } from '@playwright/test'

test.describe('Daymark smoke flows', () => {
  test('empty workspace can load the demo dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Satu ruang untuk hari-harimu/i })).toBeVisible()
    await page.getByRole('button', { name: 'Lihat dengan data contoh' }).click()
    await expect(page.getByText('Ke mana uangmu pergi')).toBeVisible()
    await expect(page.getByText(/data contoh/i).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Atur widget dashboard/i })).toHaveCount(0)
    await page.getByRole('button', { name: 'Atur widget' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Atur widget dashboard')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('finance can add a transaction', async ({ page }) => {
    await page.goto('/finance')
    await page.getByRole('button', { name: 'Tambah transaksi' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Nominal').fill('125000')
    await dialog.getByLabel('Catatan').fill('Smoke test transaksi')
    await dialog.getByRole('button', { name: 'Simpan transaksi' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Smoke test transaksi').first()).toBeVisible()
    await expect(page.getByText('Transaksi ditambahkan').first()).toBeVisible()
  })

  test('desktop navigation reaches every module', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Desktop sidebar navigation')
    await page.goto('/')
    for (const [label, heading] of [
      ['Finance', 'Keuangan'],
      ['Shopping', 'Daftar belanja'],
      ['Inventory', 'Persediaan'],
      ['Planning', 'Rencana & tugas'],
    ] as const) {
      await page.getByRole('link', { name: label, exact: true }).first().click()
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
    await page.goto('/more')
    await expect(page.getByRole('heading', { name: /Semua fitur, satu ruang/i })).toBeVisible()
    await page.getByRole('link', { name: /Internet & langganan/i }).first().click()
    await expect(page.getByRole('heading', { name: /Internet & langganan/i })).toBeVisible()
    await page.getByRole('link', { name: 'More', exact: true }).first().click()
    await page.getByRole('link', { name: /Periodic Review/i }).first().click()
    await expect(page.getByRole('heading', { name: /Evaluasi berkala/i })).toBeVisible()
  })

  test('mobile bottom navigation opens More', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only navigation')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
    await expect(nav).toBeVisible()
    await nav.getByRole('link', { name: 'More' }).click()
    await expect(page.getByRole('heading', { name: /Semua fitur, satu ruang/i })).toBeVisible()
  })
})
