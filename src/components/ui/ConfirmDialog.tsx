import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  tone = 'danger',
  loading = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      preventClose={loading}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => void onConfirm()}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <div className="flex gap-3.5">
        {tone === 'danger' ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <TriangleAlert size={20} strokeWidth={1.9} aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-ink">{title}</h3>
          <div className="mt-1 text-xs leading-relaxed text-ink-3">{description}</div>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </Modal>
  )
}
