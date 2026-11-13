import type { Transition, Variants } from 'framer-motion'

/** Motion tokens shared by every animated surface. Keep motion quiet and quick. */
export const DURATION = {
  micro: 0.15,
  fast: 0.2,
  base: 0.26,
  slow: 0.36,
  page: 0.32,
} as const

export const EASE = {
  out: [0.22, 0.8, 0.28, 1],
  inOut: [0.65, 0, 0.35, 1],
  soft: [0.25, 0.46, 0.45, 0.94],
} as const

export const transitions = {
  micro: { duration: DURATION.micro, ease: EASE.out } satisfies Transition,
  fast: { duration: DURATION.fast, ease: EASE.out } satisfies Transition,
  base: { duration: DURATION.base, ease: EASE.out } satisfies Transition,
  slow: { duration: DURATION.slow, ease: EASE.out } satisfies Transition,
  page: { duration: DURATION.page, ease: EASE.out } satisfies Transition,
  spring: { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } satisfies Transition,
  springSoft: { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 } satisfies Transition,
  springSnappy: { type: 'spring', stiffness: 550, damping: 38, mass: 0.7 } satisfies Transition,
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.micro },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: -8, transition: transitions.micro },
}

export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, y: -4, transition: transitions.micro },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.springSoft },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: transitions.fast },
}

export const sheetIn: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: transitions.springSoft },
  exit: { y: '100%', transition: transitions.base },
}

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.997 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.page },
  exit: { opacity: 0, y: -6, transition: transitions.fast },
}

export const staggerContainer = (stagger = 0.045, delayChildren = 0.04): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, y: -4, transition: transitions.micro },
}

export const countTransition = { duration: 0.9, ease: EASE.out } as const
