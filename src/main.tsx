import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { AppProvider } from '@/app/providers/app.provider'
import '@/app/i18n'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
