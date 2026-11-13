import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import App from './App'
import { initStore } from '@/lib/store'

const baseUrl = import.meta.env.BASE_URL
const basename = baseUrl.replace(/\/$/, '')

// GitHub Pages serves 404.html for deep links; that page stores the intended
// in-app path so the router can restore it before the first render.
try {
  const redirect = sessionStorage.getItem('daymark:spa-redirect')
  if (redirect) {
    sessionStorage.removeItem('daymark:spa-redirect')
    const clean = redirect.startsWith('/') ? redirect : `/${redirect}`
    window.history.replaceState(null, '', `${basename}${clean}`)
  }
} catch {
  // Session storage can be unavailable in strict privacy modes; the app still opens.
}

void initStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename || undefined}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
