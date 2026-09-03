import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, translate } from '@/lib/i18n'

// Class components cannot consume LanguageContext (they sit above the
// provider), so strings are resolved through the i18n engine using the
// persisted language preference instead.
function getBoundaryText() {
  const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  const language = normalizeLanguage(stored)

  return {
    title: translate(language, 'errors.boundary.title'),
    description: translate(language, 'errors.boundary.description'),
    tryAgain: translate(language, 'errors.boundary.tryAgain'),
    goHome: translate(language, 'errors.boundary.goHome'),
  }
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const text = getBoundaryText()

      return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-[#030309]">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {text.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {text.description}
            </p>
            {this.state.error?.message ? (
              <pre className="mt-4 overflow-auto rounded-lg bg-slate-50 px-4 py-3 text-left text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                {this.state.error.message}
              </pre>
            ) : null}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition-transform hover:-translate-y-0.5"
              >
                <RefreshCw className="h-4 w-4" />
                {text.tryAgain}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/'
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {text.goHome}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
