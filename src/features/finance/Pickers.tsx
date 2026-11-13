import { Check } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  colors: string[]
  value: string
  onChange: (color: string) => void
}

/** Rounded swatches used when a category or goal picks its accent colour. */
export function ColorPicker({ colors, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const active = color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Pilih warna ${color}`}
            aria-pressed={active}
            className={cn(
              'focus-ring relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-105',
              active ? 'border-ink/25 ring-2 ring-brand/35' : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
          >
            {active ? <Check size={15} strokeWidth={3} className="text-white drop-shadow" /> : null}
          </button>
        )
      })}
    </div>
  )
}

interface IconPickerProps {
  icons: string[]
  value: string
  onChange: (icon: string) => void
  labelPrefix?: string
}

/** Icon grid for categories and savings goals. */
export function IconPicker({ icons, value, onChange, labelPrefix = 'ikon' }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
      {icons.map((icon) => {
        const active = icon === value
        return (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            aria-label={`Pilih ${labelPrefix} ${icon}`}
            aria-pressed={active}
            className={cn(
              'focus-ring flex h-9 items-center justify-center rounded-xl border transition-colors',
              active
                ? 'border-brand/40 bg-brand/10 text-brand'
                : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink',
            )}
          >
            <DynamicIcon name={icon} size={16} strokeWidth={1.9} />
          </button>
        )
      })}
    </div>
  )
}
