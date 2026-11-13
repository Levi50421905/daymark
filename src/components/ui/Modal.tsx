import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/useMediaQuery'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  className?: string
  bodyClassName?: string
  hideClose?: boolean
  preventClose?: boolean
}

const sizes: Record<ModalSize, string> = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[540px]',
  lg: 'sm:max-w-[680px]',
  xl: 'sm:max-w-[860px]',
}

let bodyLockCount = 0
let previousOverflow = ''

function lockBody(): void {
  if (bodyLockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bodyLockCount += 1
}

function unlockBody(): void {
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  if (bodyLockCount === 0) document.body.style.overflow = previousOverflow
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  bodyClassName,
  hideClose = false,
  preventClose = false,
}: ModalProps) {
  const isMobile = useIsMobile()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previousActive = document.activeElement as HTMLElement | null
    lockBody()
    const timeout = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus({ preventScroll: true })
    }, 80)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventClose) {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.offsetParent !== null)
      if (!nodes.length) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(timeout)
      document.removeEventListener('keydown', handleKeyDown)
      unlockBody()
      previousActive?.focus?.({ preventScroll: true })
    }
  }, [open, preventClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-[var(--c-overlay)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.fast}
            onClick={preventClose ? undefined : onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            initial={isMobile ? { y: '100%', opacity: 0.9 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%', opacity: 0.92 } : { opacity: 0, scale: 0.97, y: 10 }}
            transition={isMobile ? transitions.springSoft : transitions.springSoft}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (preventClose) return
              if (info.offset.y > 120 || info.velocity.y > 700) onClose()
            }}
            className={cn(
              'relative z-10 flex w-full flex-col overflow-hidden bg-surface',
              'max-h-[92dvh] rounded-t-[28px] border border-line shadow-[0_-24px_60px_-24px_rgba(3,24,40,0.35)]',
              'sm:max-h-[88dvh] sm:rounded-[26px] sm:shadow-[0_40px_100px_-30px_rgba(3,24,40,0.5)]',
              sizes[size],
              className,
            )}
          >
            {isMobile ? (
              <div className="flex justify-center pb-1 pt-2.5">
                <span className="h-1 w-9 rounded-full bg-line-strong" aria-hidden="true" />
              </div>
            ) : null}
            {title || description || !hideClose ? (
              <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-6 sm:pt-6">
                <div className="min-w-0">
                  {title ? (
                    <h2 id={titleId} className="text-lg font-bold tracking-[-0.03em] text-ink sm:text-xl">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-ink-3 sm:text-[0.8125rem]">
                      {description}
                    </p>
                  ) : null}
                </div>
                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="focus-ring -mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6', bodyClassName)}>
              {children}
            </div>
            {footer ? (
              <div className="border-t border-line bg-surface/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:px-6 sm:pb-4">
                {footer}
              </div>
            ) : isMobile ? (
              <div className="h-[env(safe-area-inset-bottom)]" />
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}>{children}</div>
  )
}
