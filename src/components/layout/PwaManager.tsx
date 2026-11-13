import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '@/components/ui/Toast'

/** Surfaces service-worker lifecycle to the user without blocking the app. */
export function PwaManager() {
  const toast = useToast()
  const shownOfflineReady = useRef(false)
  const shownUpdate = useRef(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        window.setInterval(() => {
          if (navigator.onLine) void registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.warn('Service worker registration failed', error)
    },
  })

  useEffect(() => {
    if (offlineReady && !shownOfflineReady.current) {
      shownOfflineReady.current = true
      toast({
        title: 'Daymark siap digunakan offline',
        description: 'Semua halaman utama sudah tersimpan di perangkat ini.',
        tone: 'success',
      })
      setOfflineReady(false)
    }
  }, [offlineReady, setOfflineReady, toast])

  useEffect(() => {
    if (needRefresh && !shownUpdate.current) {
      shownUpdate.current = true
      toast({
        title: 'Versi baru Daymark tersedia',
        description: 'Muat ulang untuk memakai pembaruan terbaru.',
        tone: 'info',
        duration: 12000,
        action: {
          label: 'Perbarui sekarang',
          onClick: () => {
            void updateServiceWorker(true)
          },
        },
      })
      setNeedRefresh(false)
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker, toast])

  return null
}
