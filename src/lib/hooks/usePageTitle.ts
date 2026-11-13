import { useEffect } from 'react'

/** Keep the document title in sync with the current screen. */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — Daymark` : 'Daymark — Personal Life Planner'
    return () => {
      document.title = previous
    }
  }, [title])
}
