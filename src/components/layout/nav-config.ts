import {
  Boxes,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  ShoppingBasket,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
  description?: string
  badge?: 'tasks' | 'shopping' | 'inventory' | 'internet'
}

export const DESKTOP_NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, description: 'Ringkasan harianmu' },
  { to: '/finance', label: 'Finance', icon: Wallet, description: 'Uang & anggaran' },
  { to: '/shopping', label: 'Shopping', icon: ShoppingBasket, badge: 'shopping', description: 'Daftar belanja' },
  { to: '/inventory', label: 'Inventory', icon: Boxes, badge: 'inventory', description: 'Stok & menu' },
  { to: '/planning', label: 'Planning', icon: ListChecks, badge: 'tasks', description: 'Tugas & kalender' },
  { to: '/more', label: 'More', icon: LayoutGrid, description: 'Semua fitur' },
]

export const BOTTOM_NAV: NavItem[] = [
  { to: '/', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/finance', label: 'Finance', shortLabel: 'Finance', icon: Wallet },
  { to: '/shopping', label: 'Shopping', shortLabel: 'Shopping', icon: ShoppingBasket, badge: 'shopping' },
  { to: '/inventory', label: 'Inventory', shortLabel: 'Inventory', icon: Boxes, badge: 'inventory' },
  { to: '/more', label: 'More', shortLabel: 'More', icon: LayoutGrid },
]

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/finance': 'Finance',
  '/shopping': 'Shopping',
  '/inventory': 'Inventory',
  '/planning': 'Planning',
  '/internet': 'Internet',
  '/reviews': 'Reviews',
  '/more': 'More',
  '/settings': 'Settings',
}

export function pageTitleForPath(pathname: string): string {
  if (pathname.startsWith('/shopping/')) return 'Shopping list'
  if (pathname.startsWith('/finance')) return 'Finance'
  if (pathname.startsWith('/inventory')) return 'Inventory'
  if (pathname.startsWith('/planning')) return 'Planning'
  if (pathname.startsWith('/internet')) return 'Internet'
  if (pathname.startsWith('/reviews')) return 'Reviews'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/more')) return 'More'
  return PAGE_TITLES[pathname] ?? 'Daymark'
}

const MORE_ROUTE_PREFIXES = ['/more', '/settings', '/internet', '/reviews']

export function isDesktopNavActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/'
  if (item.to === '/more') return MORE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function isBottomNavActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/more') {
    return MORE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname.startsWith('/planning')
  }
  return isDesktopNavActive(pathname, item)
}
