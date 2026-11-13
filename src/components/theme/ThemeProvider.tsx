/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { actions, useAppData } from '@/lib/store'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import type { ThemeMode } from '@/types/domain'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const data = useAppData()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = data.settings.theme
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = resolvedTheme === 'dark' ? '#071321' : '#F4F8FC'
  }, [resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next) => actions.updateSettings({ theme: next }),
      toggleTheme: () =>
        actions.updateSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' }),
    }),
    [theme, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme harus digunakan di dalam ThemeProvider')
  return context
}
