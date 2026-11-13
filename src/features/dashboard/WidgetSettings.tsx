import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Progress'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_WIDGETS, WIDGET_META } from '@/lib/constants'
import { actions, useAppData } from '@/lib/store'
import type { DashboardWidget, WidgetId } from '@/types/domain'
import { cn } from '@/lib/utils'

interface WidgetSettingsProps {
  open: boolean
  onClose: () => void
}

function normalizeWidgets(widgets: DashboardWidget[]): DashboardWidget[] {
  const known = new Set(widgets.map((widget) => widget.id))
  const missing = DEFAULT_WIDGETS.filter((widget) => !known.has(widget.id))
  return [...widgets, ...missing]
}

export function WidgetSettings({ open, onClose }: WidgetSettingsProps) {
  const data = useAppData()
  const toast = useToast()
  const [draft, setDraft] = useState<DashboardWidget[]>(() =>
    normalizeWidgets(data.settings.dashboardWidgets),
  )
  const visibleCount = draft.filter((widget) => widget.visible).length

  useEffect(() => {
    if (open) setDraft(normalizeWidgets(data.settings.dashboardWidgets))
  }, [open, data.settings.dashboardWidgets])

  const toggle = (id: WidgetId, visible: boolean) => {
    if (!visible && visibleCount <= 1) {
      toast({ title: 'Minimal satu widget harus tampil', tone: 'warning' })
      return
    }
    setDraft((current) =>
      current.map((widget) => (widget.id === id ? { ...widget, visible } : widget)),
    )
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draft.length) return
    setDraft((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      if (item) next.splice(target, 0, item)
      return next
    })
  }

  const save = () => {
    if (visibleCount === 0) {
      toast({ title: 'Pilih minimal satu widget', tone: 'warning' })
      return
    }
    actions.setDashboardWidgets(draft)
    toast({ title: 'Tampilan dashboard diperbarui', tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Atur widget dashboard"
      description="Pilih informasi yang ingin kamu lihat, lalu atur urutannya."
      size="md"
      footer={
        <ModalFooter className="justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => setDraft(DEFAULT_WIDGETS.map((widget) => ({ ...widget })))}
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button size="sm" onClick={save}>
              Simpan tampilan
            </Button>
          </div>
        </ModalFooter>
      }
    >
      <div className="mb-3 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2">
        <span className="flex items-center gap-2 text-[0.6875rem] font-semibold text-ink-2">
          <SlidersHorizontal size={14} className="text-brand" />
          {visibleCount} dari {draft.length} widget aktif
        </span>
        <span className="text-[0.625rem] font-medium text-ink-3">Urutan atas → bawah</span>
      </div>
      <ul className="space-y-2">
        {draft.map((widget, index) => {
          const meta = WIDGET_META[widget.id]
          return (
            <li
              key={widget.id}
              className={cn(
                'flex items-center gap-3 rounded-[14px] border px-3 py-2.5 transition-colors',
                widget.visible ? 'border-line bg-surface' : 'border-line/60 bg-surface-2/60',
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 text-ink-3">
                <DynamicIcon name={meta.icon} size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-xs font-bold', widget.visible ? 'text-ink' : 'text-ink-3')}>
                  {meta.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[0.625rem] text-ink-3">{meta.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                  aria-label={`Naikkan ${meta.title}`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === draft.length - 1}
                  className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                  aria-label={`Turunkan ${meta.title}`}
                >
                  <ArrowDown size={14} />
                </button>
                <Switch
                  checked={widget.visible}
                  onChange={(visible) => toggle(widget.id, visible)}
                  ariaLabel={`Tampilkan ${meta.title}`}
                  className="[&_button]:ml-1"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
