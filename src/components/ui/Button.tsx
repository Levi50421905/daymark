import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'focus-ring inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,filter] duration-200 disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary:
    'brand-gradient border border-transparent text-white shadow-[0_12px_28px_-14px_rgba(15,169,184,0.72)] hover:brightness-[1.04] hover:shadow-[0_16px_34px_-14px_rgba(15,169,184,0.82)]',
  secondary:
    'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2',
  soft: 'border border-brand/15 bg-brand/10 text-brand hover:bg-brand/15',
  ghost: 'border border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'border border-danger/20 bg-danger/10 text-danger hover:bg-danger/15',
  outline: 'border border-brand/35 bg-transparent text-brand hover:bg-brand/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-xl px-3 text-xs',
  md: 'h-10 rounded-[14px] px-4 text-[0.8125rem]',
  lg: 'h-12 rounded-2xl px-5 text-sm',
}

const iconSizes: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 }

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={buttonClasses(variant, size, fullWidth, className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={iconSizes[size]} strokeWidth={2.1} aria-hidden="true" />
      ) : null}
      {children}
      {IconRight && !loading ? (
        <IconRight size={iconSizes[size]} strokeWidth={2.1} aria-hidden="true" />
      ) : null}
    </motion.button>
  )
}

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string
  icon: LucideIcon
  variant?: 'ghost' | 'soft' | 'danger' | 'secondary'
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const dimension = size === 'sm' ? 'h-8 w-8 rounded-[10px]' : 'h-10 w-10 rounded-[13px]'
  const tone =
    variant === 'danger'
      ? 'text-ink-3 hover:bg-danger/10 hover:text-danger'
      : variant === 'soft'
        ? 'bg-brand/10 text-brand hover:bg-brand/15'
        : variant === 'secondary'
          ? 'border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
          : 'text-ink-3 hover:bg-surface-2 hover:text-ink'
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center transition-colors duration-150',
        dimension,
        tone,
        className,
      )}
      {...rest}
    >
      <Icon size={size === 'sm' ? 15 : 18} strokeWidth={2} aria-hidden="true" />
    </motion.button>
  )
}
