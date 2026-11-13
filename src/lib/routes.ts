/**
 * Single source of truth for code-split route modules and their prefetch hooks.
 * Prefetching on hover/focus (and idle for primary routes) keeps navigation
 * immediate without loading every screen up front.
 */
export const routeModules = {
  dashboard: () => import('@/pages/DashboardPage'),
  finance: () => import('@/features/finance/FinancePage'),
  shopping: () => import('@/features/shopping/ShoppingPage'),
  inventory: () => import('@/features/inventory/InventoryPage'),
  planning: () => import('@/features/planning/PlanningPage'),
  internet: () => import('@/features/internet/InternetPage'),
  reviews: () => import('@/features/reviews/ReviewsPage'),
  more: () => import('@/pages/MorePage'),
  settings: () => import('@/pages/SettingsPage'),
  notFound: () => import('@/pages/NotFoundPage'),
} as const

const EXACT_ROUTES: Record<string, () => Promise<unknown>> = {
  '/': routeModules.dashboard,
  '/finance': routeModules.finance,
  '/shopping': routeModules.shopping,
  '/inventory': routeModules.inventory,
  '/planning': routeModules.planning,
  '/internet': routeModules.internet,
  '/reviews': routeModules.reviews,
  '/more': routeModules.more,
  '/settings': routeModules.settings,
}

const PREFIX_ROUTES: Array<[string, () => Promise<unknown>]> = [
  ['/shopping/', routeModules.shopping],
  ['/finance/', routeModules.finance],
  ['/inventory/', routeModules.inventory],
  ['/planning/', routeModules.planning],
  ['/internet/', routeModules.internet],
  ['/reviews/', routeModules.reviews],
  ['/more/', routeModules.more],
  ['/settings/', routeModules.settings],
]

export function prefetchRoute(pathname: string): void {
  const [path] = pathname.split(/[?#]/, 1)
  const exact = EXACT_ROUTES[path]
  if (exact) {
    void exact()
    return
  }
  for (const [prefix, loader] of PREFIX_ROUTES) {
    if (path.startsWith(prefix)) {
      void loader()
      return
    }
  }
}

/** Warm the primary navigation after the first paint so later taps feel instant. */
export function prefetchPrimaryRoutes(): void {
  for (const route of ['/finance', '/shopping', '/inventory', '/planning', '/more']) {
    prefetchRoute(route)
  }
}
