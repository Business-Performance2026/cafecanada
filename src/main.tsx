import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import { LangProvider } from "@/lib/i18n"
import { AuthProvider } from "@/hooks/useAuth"
import { Toaster } from "@/components/ui/sonner"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <LangProvider>
          <App />
          <Toaster />
        </LangProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
