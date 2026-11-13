import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { formatDigitsWhileTyping, parseAmount, currencySymbol } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CurrencyCode } from '@/types/domain'

interface FieldProps {
  label?: ReactNode
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, error, required, optional, children, className }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={htmlFor} className="text-xs font-semibold text-ink-2">
            {label}
            {required ? <span className="ml-0.5 text-danger">*</span> : null}
          </label>
          {optional ? <span className="text-[0.6875rem] font-medium text-ink-3">Opsional</span> : null}
        </div>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-[0.6875rem] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field h-11', className)} {...rest} />
}

export function Textarea({ className, rows = 3, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn('field resize-none leading-relaxed', className)} {...rest} />
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

export function Select({ className, wrapperClassName, children, ...rest }: SelectProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select className={cn('field h-11 appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden="true"
      />
    </div>
  )
}

interface AmountInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> {
  value: number
  onValueChange: (value: number) => void
  currency: CurrencyCode
  wrapperClassName?: string
}

export function AmountInput({
  value,
  onValueChange,
  currency,
  className,
  wrapperClassName,
  placeholder = '0',
  ...rest
}: AmountInputProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-3">
        {currencySymbol(currency)}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatDigitsWhileTyping(value)}
        onChange={(event) => onValueChange(parseAmount(event.target.value))}
        placeholder={placeholder}
        className={cn('field h-11 pl-11 text-right font-semibold number', className)}
        {...rest}
      />
    </div>
  )
}

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string
  onValueChange: (value: string) => void
}

export function DateInput({ value, onValueChange, className, ...rest }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn('field h-11 number', className)}
      {...rest}
    />
  )
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>
}

export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end', className)}>
      {children}
    </div>
  )
}
