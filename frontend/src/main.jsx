import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
