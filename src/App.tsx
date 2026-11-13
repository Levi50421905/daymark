import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BootError, BootSplash } from '@/components/layout/BootScreen'
import { PwaManager } from '@/components/layout/PwaManager'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { initStore, startWithoutStorage, useAppStore } from '@/lib/store'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const FinancePage = lazy(() => import('@/features/finance/FinancePage'))
const ShoppingPage = lazy(() => import('@/features/shopping/ShoppingPage'))
const InventoryPage = lazy(() => import('@/features/inventory/InventoryPage'))
const PlanningPage = lazy(() => import('@/features/planning/PlanningPage'))
const InternetPage = lazy(() => import('@/features/internet/InternetPage'))
const ReviewsPage = lazy(() => import('@/features/reviews/ReviewsPage'))
const MorePage = lazy(() => import('@/pages/MorePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

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
