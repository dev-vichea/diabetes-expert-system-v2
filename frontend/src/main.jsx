import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/app.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function GoogleAuthProviderWrapper({ children }) {
  if (!googleClientId) return children
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>
}

// Automatically reload the page when a dynamic chunk fails to load due to a new build / deployment
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Preload error detected, reloading page with latest build...', event)
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleAuthProviderWrapper>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </GoogleAuthProviderWrapper>
    </ErrorBoundary>
  </React.StrictMode>
)
