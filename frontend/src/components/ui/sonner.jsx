import { useEffect, useState } from 'react'
import { Toaster as SonnerToaster } from 'sonner'

function getResolvedTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function Toaster() {
  const [theme, setTheme] = useState(getResolvedTheme)

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setTheme(root.classList.contains('dark') ? 'dark' : 'light')
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    setTheme(root.classList.contains('dark') ? 'dark' : 'light')

    return () => observer.disconnect()
  }, [])

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      closeButton
      expand={false}
      offset={20}
      unstyled
      toastOptions={{
        classNames: {
          toast:
            'group rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-[0_18px_44px_-18px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
          title: 'text-sm font-semibold',
          description: 'text-sm text-slate-500 dark:text-slate-400',
          content: 'gap-1.5',
          icon: 'text-current',
          loading:
            '',
          default:
            '',
          actionButton:
            'rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200',
          cancelButton:
            'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
          closeButton:
            'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        },
      }}
    />
  )
}
