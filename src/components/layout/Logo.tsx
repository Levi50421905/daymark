import { useId } from 'react'
import { cn } from '@/lib/utils'

export function LogoMark({ size = 38, className }: { size?: number; className?: string }) {
  const gradientId = `logo-${useId().replace(/:/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#74C9FF" />
          <stop offset="0.5" stopColor="#31C5D1" />
          <stop offset="1" stopColor="#0A89A8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill={`url(#${gradientId})`} />
      <path
        d="M16 40.5h32"
        stroke="white"
        strokeWidth="3.3"
        strokeLinecap="round"
        opacity="0.96"
      />
      <path
        d="M25 36.2a7 7 0 0 1 14 0"
        stroke="white"
        strokeWidth="3.3"
        strokeLinecap="round"
        opacity="0.96"
      />
      <circle cx="32" cy="20.5" r="2.7" fill="white" opacity="0.96" />
    </svg>
  )
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[1.0625rem] font-extrabold leading-tight tracking-[-0.045em] text-ink">
        Daymark
      </span>
      {!compact ? (
        <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.19em] text-ink-3">
          Personal life planner
        </span>
      ) : null}
    </span>
  )
}
