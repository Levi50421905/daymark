import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { countTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface CountUpProps {
  value: number
  format?: (value: number) => string
  className?: string
  duration?: number
  from?: number
}

/** Animated numeric value with an accessible static label. */
export function CountUp({
  value,
  format = (input) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(input),
  className,
  duration = countTransition.duration,
  from = 0,
}: CountUpProps) {
  const reduceMotion = useReducedMotion()
  const previous = useRef<number>(reduceMotion ? value : from)
  const [display, setDisplay] = useState(() => (reduceMotion ? value : from))

  useEffect(() => {
    if (reduceMotion) {
      previous.current = value
      setDisplay(value)
      return
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: countTransition.ease,
      onUpdate: (latest) => setDisplay(latest),
    })
    previous.current = value
    return () => controls.stop()
  }, [value, duration, reduceMotion])

  return (
    <span className={cn('number', className)} aria-label={format(value)}>
      <span aria-hidden="true">{format(display)}</span>
    </span>
  )
}
