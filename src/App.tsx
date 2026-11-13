import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BootError, BootSplash } from '@/components/layout/BootScreen'
import { PwaManager } from '@/components/layout/PwaManager'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { initStore, startWithoutStorage, useAppStore } from '@/lib/store'
import { routeModules } from '@/lib/routes'

const DashboardPage = lazy(routeModules.dashboard)
const FinancePage = lazy(routeModules.finance)
const ShoppingPage = lazy(routeModules.shopping)
const InventoryPage = lazy(routeModules.inventory)
const PlanningPage = lazy(routeModules.planning)
const InternetPage = lazy(routeModules.internet)
const ReviewsPage = lazy(routeModules.reviews)
const MorePage = lazy(routeModules.more)
const SettingsPage = lazy(routeModules.settings)
const NotFoundPage = lazy(routeModules.notFound)

export default function App() {
  const { status, error } = useAppStore()

  if (status === 'loading') return <BootSplash />
  if (status === 'error') {
    return (
      <BootError
        error={error ?? 'Penyimpanan lokal tidak dapat diakses.'}
        onRetry={() => void initStore(true)}
        onContinue={startWithoutStorage}
      />
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/shopping/:listId" element={<ShoppingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/internet" element={<InternetPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
        <PwaManager />
      </ToastProvider>
    </ThemeProvider>
  )
}
