/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, Info, Sparkles, TriangleAlert, X } from 'lucide-react'
import { transitions } from '@/lib/motion'
import { cn, uid } from '@/lib/utils'

export type ToastTone = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number
  action?: ToastAction
}

interface ToastRecord extends Required<Omit<ToastOptions, 'description' | 'action'>> {
  id: string
  description?: string
  action?: ToastAction
}

type ToastFn = (options: ToastOptions | string) => void

const ToastContext = createContext<ToastFn | null>(null)

const toneMeta: Record<
  ToastTone,
  { icon: typeof CheckCircle2; iconClass: string; accent: string; bar: string }
> = {
  default: { icon: Sparkles, iconClass: 'text-brand bg-brand/10', accent: 'border-line', bar: 'bg-brand' },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success bg-success/10',
    accent: 'border-success/20',
    bar: 'bg-success',
  },
  error: {
    icon: CircleAlert,
    iconClass: 'text-danger bg-danger/10',
    accent: 'border-danger/20',
    bar: 'bg-danger',
  },
  warning: {
    icon: TriangleAlert,
    iconClass: 'text-warning bg-warning/10',
    accent: 'border-warning/20',
    bar: 'bg-warning',
  },
  info: { icon: Info, iconClass: 'text-sky bg-sky/10', accent: 'border-sky/20', bar: 'bg-sky' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const show = useCallback<ToastFn>(
    (input) => {
      const options = typeof input === 'string' ? { title: input } : input
      const record: ToastRecord = {
        id: uid('toast'),
        title: options.title,
        description: options.description,
        tone: options.tone ?? 'default',
        duration: options.duration ?? 4200,
        action: options.action,
      }
      setItems((current) => [...current.slice(-2), record])
      const timer = setTimeout(() => dismiss(record.id), record.duration)
      timers.current.set(record.id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      for (const timer of currentTimers.values()) clearTimeout(timer)
      currentTimers.clear()
    }
  }, [])

  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[120] flex flex-col-reverse items-stretch gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => {
            const meta = toneMeta[item.tone]
            const Icon = meta.icon
            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96, transition: transitions.fast }}
                transition={transitions.springSoft}
                className={cn(
                  'pointer-events-auto relative overflow-hidden rounded-2xl border bg-surface/95 p-3.5 pr-10 shadow-[0_20px_60px_-24px_rgba(6,36,56,0.45)] backdrop-blur-xl',
                  meta.accent,
                )}
                role="status"
              >
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', meta.iconClass)}>
                    <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-bold leading-relaxed text-ink">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">{item.description}</p>
                    ) : null}
                    {item.action ? (
                      <button
                        type="button"
                        onClick={() => {
                          item.action?.onClick()
                          dismiss(item.id)
                        }}
                        className="mt-2 text-[0.6875rem] font-bold text-brand underline-offset-2 hover:underline"
                      >
                        {item.action.label}
                      </button>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="focus-ring absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                  aria-label="Tutup notifikasi"
                >
                  <X size={14} />
                </button>
                <motion.span
                  className={cn('absolute inset-x-0 bottom-0 h-[2px] origin-left', meta.bar)}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: item.duration / 1000, ease: 'linear' }}
                  aria-hidden="true"
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastFn {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast harus digunakan di dalam ToastProvider')
  return context
}
