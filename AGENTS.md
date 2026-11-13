# Daymark — Agent Guide

Daymark is a local-first personal life planner PWA. The product should feel calm, premium, personal, and practical — not like an admin dashboard or a finance enterprise tool.

## Stack

- React 19 + TypeScript (strict) + Vite 8
- Tailwind CSS 4 (tokens in `src/index.css`) + small custom CSS component classes
- Framer Motion for motion, Lucide for icons
- IndexedDB via `idb`, single versioned `AppData` document
- React Router (BrowserRouter), vite-plugin-pwa

## Commands

```bash
npm run dev
npm run typecheck         # tsc -b, writes tsbuildinfo
npx tsc --noEmit -p tsconfig.app.json   # safe concurrent typecheck
npm run test              # vitest (later)
npm run build             # Lead runs this after integration
```

Do not install new packages without asking the Lead. Do not edit `package.json`, `vite.config.ts`, `src/lib/**`, `src/types/**`, `src/components/**`, `src/App.tsx`, `src/index.css`, or `src/pages/**` unless your task explicitly owns them. Feature work lives under `src/features/<feature>/`.

## Language

- UI copy: Indonesian, warm and concise. Navigation module names stay in English (Overview, Finance, Shopping, Inventory, Planning, More).
- Dates and month labels must use the helpers in `src/lib/dates.ts` (Indonesian locale).
- Never hardcode “Rp” in UI. Use `settings.currency`, `formatMoney`, `MoneyText`, or `AmountInput`.
- Empty states should teach the user what to do next.

## Architecture contracts

- `useAppData()` returns the current `AppData`. `useAppStore()` also exposes save status.
- Use `actions` from `@/lib/store` for every mutation. Never mutate the data object directly.
- All money is stored as a plain number in the configured currency’s major unit.
- All dates are local ISO date strings (`YYYY-MM-DD`); timestamps are ISO strings from `new Date().toISOString()`.
- Derivations live in `src/lib/calc.ts`. Do not recompute a metric differently from the shared function if one exists.
- Useful helpers: `src/lib/dates.ts`, `src/lib/format.ts`, `src/lib/motion.ts`, `src/lib/constants.ts`.
- After a successful action, show `toast` feedback. Catch errors and show `toast({ tone: 'error', title: ..., description: error.message })`.
- Modal forms should validate before calling the action; all amounts must be > 0 unless the field is explicitly optional.

## Design system

Use the shared components in `src/components/ui`:

- `Button`, `IconButton`, `buttonClasses`
- `Card`, `SectionHeading`
- `PageHeader`
- `Field`, `TextInput`, `Textarea`, `Select`, `AmountInput`, `DateInput`, `FormGrid`, `FormActions`
- `Modal`, `ModalFooter`, `ConfirmDialog`
- `SegmentedControl`
- `ProgressBar`, `Switch`
- `Badge`, `StatusDot`
- `EmptyState`
- `Skeleton`, `SkeletonText`
- `CountUp`, `MoneyText`, `MoneyDelta`
- `CategoryIcon`, `DynamicIcon`, `IconTile`
- `useToast`
- Charts: `DonutChart`, `ChartLegend`, `CircularProgress`, `TrendChart`, `Sparkline`

Use `surface-card` for outer cards, `surface-muted` for inset rows, `field` for inputs. Card radius is ~22px. Choose a composition of cards, rows, tables, and charts — avoid a grid of identical boxes.

### Visual rules

- Light canvas: white, ice blue, turquoise, soft mint, lavender, warm peach accents.
- Use gradients sparingly: hero/primary action/progress highlights, not every card.
- Text hierarchy: `text-ink` (primary), `text-ink-2` (secondary), `text-ink-3` (muted).
- Minimum touch target 44px on mobile. Icon-only buttons need `aria-label`.
- Mobile: single column, sticky header handled by shell, no fixed nav inside pages.
- Desktop: use 2/3–1/3 or bento grids; do not stretch a mobile stack across 1400px without composition.
- Ensure dark mode works by using tokens (`bg-surface`, `text-ink`, etc.), not literal white/black.
- Respect `prefers-reduced-motion` (global MotionConfig handles Framer Motion; keep CSS animations quiet).

### Motion rules

- Use tokens in `src/lib/motion.ts` (`transitions`, `fadeUp`, `listItem`, `springSoft`).
- Entrance animations: stagger 40–60ms, y 6–12px, duration 180–350ms.
- Use `layout`/`layoutId` for list reorder and nav indicators.
- Animate meaningful changes only: list item removal, checkbox completion, progress bar, modal, money counter.
- No infinite decorative animations inside content. No parallax.
- Never block an action while an animation is playing.

## Page structure for feature owners

Each feature must:

1. Render `<PageHeader eyebrow=... title=... description=... actions={...} />`.
2. Use actual store data and working CRUD actions.
3. Have a polished empty state for first use.
4. Work on 390px mobile and 1440px desktop.
5. Include all fields/interactions listed in the feature brief.
6. Use modals/bottom sheets for create/edit forms; confirm destructive actions.
7. Persist through the shared store (no local-only data for real features).

## Verification

- `npx tsc --noEmit -p tsconfig.app.json` must be clean for files you own.
- Check that every button does something. No decorative controls.
- Keep feature-specific components and helpers inside your feature folder.
- If a shared API or component is missing, message the Lead; do not edit shared files silently.
