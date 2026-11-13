import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  Database,
  Download,
  Laptop,
  LayoutGrid,
  Moon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  WifiOff,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusDot } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Select, TextInput } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { WidgetSettings } from '@/features/dashboard/WidgetSettings'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { CURRENCIES, WIDGET_META, APP_VERSION } from '@/lib/constants'
import { formatSavedAgo } from '@/lib/format'
import { formatDate, relativeTimeLabel, todayISO } from '@/lib/dates'
import { buildBackupEnvelope, DataValidationError, parseBackupText } from '@/lib/validation'
import { downloadFile } from '@/lib/utils'
import { getStorageEstimate } from '@/lib/storage'
import { actions, saveNow, useAppData, useAppStore } from '@/lib/store'
import type { AppData, ThemeMode, WeekStart } from '@/types/domain'
import { cn } from '@/lib/utils'

interface SettingsSectionProps {
  id: string
  icon: typeof User
  color: string
  title: string
  description: string
  children: ReactNode
  className?: string
}

function SettingsSection({
  id,
  icon: Icon,
  color,
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section id={id} className={cn('surface-card scroll-mt-24 p-5 sm:p-6', className)}>
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            borderColor: `color-mix(in srgb, ${color} 18%, transparent)`,
          }}
          aria-hidden="true"
        >
          <Icon size={18} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
          <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 KB'
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export default function SettingsPage() {
  const data = useAppData()
  const { saveStatus, lastSavedAt } = useAppStore()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const online = useOnlineStatus()
  const install = useInstallPrompt()
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<{
    data: AppData
    counts: Record<string, number>
    filename: string
  } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currency = data.settings.currency
  const displayName = data.settings.userName.trim() || 'Sahabat'
  const initials = displayName.slice(0, 1).toUpperCase()
  const visibleWidgets = data.settings.dashboardWidgets.filter((widget) => widget.visible)
  const themeLabel = theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'
  const hasData =
    data.transactions.length > 0 ||
    data.shoppingLists.length > 0 ||
    data.inventory.length > 0 ||
    data.tasks.length > 0 ||
    data.goals.length > 0 ||
    data.reviews.length > 0 ||
    data.budgets.length > 0 ||
    data.mealPlans.length > 0 ||
    data.subscriptions.length > 0 ||
    data.devices.length > 0 ||
    data.dataPackages.length > 0 ||
    data.checklists.length > 0

  useEffect(() => {
    void getStorageEstimate().then(setStorage)
  }, [data.meta.updatedAt])

  useEffect(() => {
    if (!location.hash) return
    const timeout = window.setTimeout(() => {
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
    return () => window.clearTimeout(timeout)
  }, [location.hash])

  const handleExport = () => {
    const envelope = buildBackupEnvelope(data)
    const filename = `daymark-backup-${todayISO()}.json`
    downloadFile(filename, JSON.stringify(envelope, null, 2))
    actions.markBackup()
    toast({
      title: 'Backup diunduh',
      description: `${filename} · ${data.transactions.length} transaksi, ${data.shoppingLists.length} daftar belanja.`,
      tone: 'success',
    })
  }

  const handleFileSelected = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = parseBackupText(text)
      setPendingImport({ data: parsed.data, counts: parsed.counts, filename: file.name })
    } catch (error) {
      toast({
        title: 'Backup tidak bisa dibaca',
        description:
          error instanceof DataValidationError || error instanceof Error
            ? error.message
            : 'Pastikan file JSON berasal dari Daymark.',
        tone: 'error',
      })
    }
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    setImporting(true)
    try {
      actions.replaceData(pendingImport.data)
      setPendingImport(null)
      toast({ title: 'Data berhasil dipulihkan', tone: 'success' })
      navigate('/')
    } finally {
      setImporting(false)
    }
  }

  const confirmReset = async () => {
    setResetting(true)
    try {
      await actions.clearAllData()
      setResetOpen(false)
      toast({ title: 'Semua data dihapus', description: 'Daymark kembali ke ruang kosong.', tone: 'success' })
      navigate('/')
    } catch (error) {
      toast({
        title: 'Gagal menghapus data',
        description: error instanceof Error ? error.message : 'Coba lagi.',
        tone: 'error',
      })
    } finally {
      setResetting(false)
    }
  }

  const confirmDemo = () => {
    actions.loadDemoData()
    setDemoOpen(false)
    toast({ title: 'Data contoh dimuat', tone: 'success' })
    navigate('/')
  }

  const installApp = async () => {
    const outcome = await install.promptInstall()
    if (outcome === 'accepted') {
      toast({ title: 'Daymark dipasang', description: 'Buka dari layar utama kapan saja.', tone: 'success' })
    } else {
      toast({
        title: install.isIos ? 'Tambahkan ke Layar Utama' : 'Pasang lewat menu browser',
        description: install.isIos
          ? 'Buka menu Bagikan di Safari, lalu pilih “Tambah ke Layar Utama”.'
          : 'Buka menu browser dan pilih “Install app” / “Tambahkan ke layar utama”.',
        tone: 'info',
      })
    }
  }

  const saveNowManually = async () => {
    try {
      await saveNow()
      toast({ title: 'Data tersimpan', description: 'Snapshot terbaru sudah aman di perangkat ini.', tone: 'success' })
    } catch (error) {
      toast({
        title: 'Gagal menyimpan',
        description: error instanceof Error ? error.message : 'Coba lagi.',
        tone: 'error',
      })
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Pengaturan & data"
        description="Sesuaikan Daymark dengan ritmemu. Semua pengaturan dan data tetap tersimpan lokal."
        actions={
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[0.6875rem] font-bold text-ink-2">
            <ShieldCheck size={14} className="text-success" aria-hidden="true" />
            Local-first · v{APP_VERSION}
          </span>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SettingsSection
            id="profile"
            icon={User}
            color="#5FA8F5"
            title="Profil & preferensi"
            description="Nama tampilan, tema, mata uang, dan awal minggu."
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky/20 via-brand/15 to-mint/20 text-xl font-extrabold text-brand">
                  {initials}
                </span>
                <Field
                  label="Nama panggilan"
                  htmlFor="settings-name"
                  hint="Dipakai untuk sapaan hangat di Overview."
                  className="flex-1"
                >
                  <TextInput
                    id="settings-name"
                    value={data.settings.userName}
                    onChange={(event) => actions.updateSettings({ userName: event.target.value })}
                    placeholder="Sahabat"
                    maxLength={80}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Tema tampilan"
                  hint="Mode gelap dirancang khusus, bukan sekadar inversi."
                  className="sm:col-span-2"
                >
                  <SegmentedControl<ThemeMode>
                    value={theme}
                    onChange={(next) => setTheme(next)}
                    className="w-full"
                    options={[
                      { value: 'light', label: 'Terang', icon: Sun },
                      { value: 'dark', label: 'Gelap', icon: Moon },
                      { value: 'system', label: 'Ikuti sistem', icon: Laptop },
                    ]}
                  />
                </Field>
                <Field
                  label="Mata uang"
                  htmlFor="settings-currency"
                  hint="Nominal yang sudah ada tidak dikonversi."
                >
                  <Select
                    id="settings-currency"
                    value={currency}
                    onChange={(event) =>
                      actions.updateSettings({
                        currency: event.target.value as typeof currency,
                      })
                    }
                  >
                    {CURRENCIES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} — {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Awal minggu" hint="Dipakai untuk kalender, review mingguan, dan meal planner.">
                  <SegmentedControl<WeekStart>
                    value={data.settings.weekStartsOn}
                    onChange={(next) => actions.updateSettings({ weekStartsOn: next })}
                    className="w-full"
                    options={[
                      { value: 'monday', label: 'Senin' },
                      { value: 'sunday', label: 'Minggu' },
                    ]}
                  />
                </Field>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="dashboard"
            icon={LayoutGrid}
            color="#8B8FF7"
            title="Dashboard"
            description="Atur informasi apa yang muncul di Overview dan urutannya."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{visibleWidgets.length} widget aktif</Badge>
                  <Badge tone="neutral">{WIDGET_META.finance.title}</Badge>
                  {visibleWidgets.slice(0, 2).map((widget) => (
                    <Badge key={widget.id} tone="neutral">
                      {WIDGET_META[widget.id].title}
                    </Badge>
                  ))}
                  {visibleWidgets.length > 3 ? (
                    <span className="text-[0.625rem] font-semibold text-ink-3">
                      +{visibleWidgets.length - 3} lainnya
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[0.6875rem] leading-relaxed text-ink-3">
                  Susun ulang dengan tombol naik/turun. Pengaturan tersimpan otomatis.
                </p>
              </div>
              <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setWidgetsOpen(true)}>
                Atur widget
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            id="data"
            icon={Database}
            color="#2EC4B6"
            title="Data & backup"
            description="Ekspor, pulihkan, dan kelola seluruh data lokal Daymark."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2/70 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-ink-2">
                    <StatusDot
                      tone={saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'warning' : 'success'}
                      pulse={saveStatus === 'saving'}
                    />
                    {saveStatus === 'saving' ? 'Menyimpan…' : saveStatus === 'error' ? 'Gagal menyimpan' : 'Tersimpan otomatis'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void saveNowManually()}
                    className="focus-ring rounded-lg px-2 py-1 text-[0.625rem] font-bold text-brand hover:bg-brand/5"
                  >
                    Simpan sekarang
                  </button>
                </div>
                <p className="mt-2 text-[0.6875rem] text-ink-3">
                  {lastSavedAt ? `Terakhir ${relativeTimeLabel(lastSavedAt).toLowerCase()}` : 'Belum ada perubahan'}
                </p>
                <div className="mt-3 border-t border-line/70 pt-2.5">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-ink-3">Backup terakhir</p>
                  <p className="mt-0.5 text-xs font-bold text-ink">
                    {data.meta.lastBackupAt ? formatSavedAgo(data.meta.lastBackupAt) : 'Belum pernah'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/70 p-3.5">
                <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-ink-3">Isi workspace</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {[
                    ['Transaksi', data.transactions.length],
                    ['Daftar belanja', data.shoppingLists.length],
                    ['Stok', data.inventory.length],
                    ['Tugas', data.tasks.length],
                    ['Evaluasi', data.reviews.length],
                    ['Langganan', data.subscriptions.length],
                  ].map(([label, count]) => (
                    <div key={String(label)} className="flex items-center justify-between gap-2">
                      <span className="text-[0.625rem] text-ink-3">{label}</span>
                      <span className="number text-[0.6875rem] font-bold text-ink">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-line/70 pt-2 text-[0.625rem] text-ink-3">
                  {storage ? `${formatBytes(storage.usage)} terpakai di origin ini` : 'Penyimpanan lokal IndexedDB'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button icon={Download} onClick={handleExport} className="sm:flex-1">
                Ekspor backup JSON
              </Button>
              <Button
                variant="secondary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                className="sm:flex-1"
              >
                Impor backup
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void handleFileSelected(file)
                }}
              />
            </div>
            <p className="mt-2.5 text-[0.625rem] leading-relaxed text-ink-3">
              Export berisi semua data dalam satu file JSON. Import akan mengganti data saat ini setelah
              kamu mengonfirmasi. Tidak ada data yang dikirim ke server.
            </p>

            <div className="mt-5 rounded-xl border border-danger/20 bg-danger/[0.035] p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                  <Trash2 size={14} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink">Zona hati-hati</p>
                  <p className="mt-0.5 text-[0.625rem] leading-relaxed text-ink-3">
                    Mulai dengan data contoh untuk menjelajah, atau hapus seluruh data dan mulai dari nol.
                    Tindakan ini tidak bisa dibatalkan tanpa backup.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setDemoOpen(true)}>
                      Muat data contoh
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setResetOpen(true)}
                      disabled={!hasData}
                    >
                      Hapus semua data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="app"
            icon={Smartphone}
            color="#F4A261"
            title="Aplikasi & offline"
            description="Pasang Daymark ke layar utama dan gunakan tanpa koneksi."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-ink-2">
                    {online ? <Check size={13} className="text-success" /> : <WifiOff size={13} className="text-warning" />}
                    {online ? 'Terhubung' : 'Offline'}
                  </span>
                  <Badge tone={install.installed ? 'success' : 'neutral'}>
                    {install.installed ? 'Terpasang' : 'Browser'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs font-bold text-ink">Offline-first</p>
                <p className="mt-0.5 text-[0.625rem] leading-relaxed text-ink-3">
                  Aset aplikasi dan data inti tersedia tanpa koneksi. Perubahan disimpan ke IndexedDB di
                  perangkat ini.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-2/70 p-4">
                <div>
                  <p className="text-xs font-bold text-ink">
                    {install.installed ? 'Daymark sudah terpasang' : 'Pasang sebagai aplikasi'}
                  </p>
                  <p className="mt-1 text-[0.625rem] leading-relaxed text-ink-3">
                    {install.installed
                      ? 'Buka dari layar utama untuk pengalaman standalone.'
                      : install.isIos
                        ? 'Di iPhone/iPad: menu Bagikan → Tambah ke Layar Utama.'
                        : 'Gunakan tombol di bawah atau menu browser “Install app”.'}
                  </p>
                </div>
                {install.installed ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-success">
                    <ShieldCheck size={13} /> Siap digunakan offline
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={install.canInstall ? Download : Smartphone}
                    onClick={() => void installApp()}
                    className="mt-3 self-start"
                  >
                    {install.canInstall ? 'Pasang Daymark' : 'Cara memasang'}
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.625rem] font-medium text-ink-3">
              <span className="rounded-lg border border-line bg-surface-2 px-2 py-1">Web App Manifest</span>
              <span className="rounded-lg border border-line bg-surface-2 px-2 py-1">Service Worker</span>
              <span className="rounded-lg border border-line bg-surface-2 px-2 py-1">IndexedDB</span>
              <span className="rounded-lg border border-line bg-surface-2 px-2 py-1">v{APP_VERSION}</span>
            </div>
          </SettingsSection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="surface-card relative overflow-hidden p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-lavender/8" aria-hidden="true" />
            <div className="relative z-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <ShieldCheck size={21} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-sm font-extrabold text-ink">Status data</h2>
              <p className="mt-1 text-[0.625rem] leading-relaxed text-ink-3">
                Semua data tersimpan di perangkat ini. Backup terakhir:
              </p>
              <p className="mt-1.5 text-xs font-bold text-ink">
                {data.meta.lastBackupAt ? formatSavedAgo(data.meta.lastBackupAt) : 'Belum pernah backup'}
              </p>
              <div className="mt-4 space-y-2 border-t border-line/80 pt-3">
                <div className="flex items-center justify-between text-[0.625rem]">
                  <span className="text-ink-3">Auto-save</span>
                  <span className="flex items-center gap-1.5 font-bold text-ink">
                    <StatusDot tone={saveStatus === 'error' ? 'danger' : 'success'} />
                    {saveStatus === 'error' ? 'Bermasalah' : 'Aktif'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[0.625rem]">
                  <span className="text-ink-3">Mata uang</span>
                  <span className="font-bold text-ink">{currency}</span>
                </div>
                <div className="flex items-center justify-between text-[0.625rem]">
                  <span className="text-ink-3">Tema</span>
                  <span className="font-bold text-ink">{themeLabel}</span>
                </div>
                <div className="flex items-center justify-between text-[0.625rem]">
                  <span className="text-ink-3">Backup</span>
                  <span className={cn('font-bold', hasData ? 'text-warning' : 'text-ink-3')}>
                    {data.meta.lastBackupAt ? 'Ada' : 'Belum ada'}
                  </span>
                </div>
              </div>
              <Button variant="soft" size="sm" fullWidth icon={Download} className="mt-4" onClick={handleExport}>
                Ekspor sekarang
              </Button>
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender/10 text-lavender">
                <Palette size={17} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Tentang Daymark</p>
                <p className="mt-1 text-[0.625rem] leading-relaxed text-ink-3">
                  Personal life planner untuk kehidupan sehari-hari. Data milikmu, tanpa akun, tanpa iklan.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line/80 pt-3 text-[0.625rem]">
              <span className="text-ink-3">Versi aplikasi</span>
              <span className="font-bold text-ink">{APP_VERSION}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[0.625rem]">
              <span className="text-ink-3">Skema data</span>
              <span className="font-bold text-ink">v{data.meta.schemaVersion}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[0.625rem]">
              <span className="text-ink-3">Dibuat</span>
              <span className="font-bold text-ink">{formatDate(data.meta.createdAt.slice(0, 10), 'd MMM yyyy')}</span>
            </div>
          </div>
        </aside>
      </div>

      <WidgetSettings open={widgetsOpen} onClose={() => setWidgetsOpen(false)} />

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Pulihkan backup ini?"
        description="Data saat ini akan diganti dengan isi file backup. Pastikan kamu sudah mengekspor data terbaru bila diperlukan."
        confirmLabel="Pulihkan data"
        tone="primary"
        loading={importing}
      >
        {pendingImport ? (
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="truncate text-[0.625rem] font-bold text-ink">{pendingImport.filename}</p>
            <p className="mt-0.5 text-[0.625rem] text-ink-3">
              {pendingImport.data.meta.updatedAt
                ? `Terakhir diubah ${relativeTimeLabel(pendingImport.data.meta.updatedAt).toLowerCase()}`
                : 'File backup Daymark'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(pendingImport.counts).map(([label, count]) => (
                <Badge key={label} tone="neutral">
                  {count} {label}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={confirmReset}
        title="Hapus semua data?"
        description="Seluruh transaksi, daftar belanja, stok, tugas, langganan, dan evaluasi akan dihapus dari perangkat ini. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus semua"
        loading={resetting}
      />

      <ConfirmDialog
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onConfirm={confirmDemo}
        title="Muat data contoh?"
        description="Data contoh akan mengganti isi workspace saat ini. Kamu bisa menghapusnya kapan saja dari Settings."
        confirmLabel="Muat contoh"
        tone="primary"
      />
    </div>
  )
}
