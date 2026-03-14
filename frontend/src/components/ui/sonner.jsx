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
            'group rounded-3xl border border-slate-200 border-l-[6px] bg-white text-slate-950 shadow-[0_18px_44px_-18px_rgba(15,23,42,0.18)] dark:border-[#1f2640] dark:bg-[#070712] dark:text-slate-50 data-[type=success]:border-emerald-200 data-[type=success]:border-l-emerald-500 data-[type=success]:bg-emerald-50 data-[type=success]:text-emerald-950 data-[type=error]:border-rose-200 data-[type=error]:border-l-rose-500 data-[type=error]:bg-rose-50 data-[type=error]:text-rose-950 data-[type=warning]:border-amber-200 data-[type=warning]:border-l-amber-500 data-[type=warning]:bg-amber-50 data-[type=warning]:text-amber-950 data-[type=info]:border-cyan-200 data-[type=info]:border-l-cyan-500 data-[type=info]:bg-cyan-50 data-[type=info]:text-cyan-950 dark:data-[type=success]:border-emerald-900/50 dark:data-[type=success]:border-l-emerald-400 dark:data-[type=success]:bg-emerald-950/20 dark:data-[type=success]:text-emerald-100 dark:data-[type=error]:border-rose-900/50 dark:data-[type=error]:border-l-rose-400 dark:data-[type=error]:bg-rose-950/20 dark:data-[type=error]:text-rose-100 dark:data-[type=warning]:border-amber-900/50 dark:data-[type=warning]:border-l-amber-400 dark:data-[type=warning]:bg-amber-950/20 dark:data-[type=warning]:text-amber-100 dark:data-[type=info]:border-cyan-900/50 dark:data-[type=info]:border-l-cyan-400 dark:data-[type=info]:bg-cyan-950/20 dark:data-[type=info]:text-cyan-100',
          title: 'text-sm font-semibold',
          description: 'text-sm text-slate-500 dark:text-slate-400',
          content: 'gap-1.5',
          icon: 'text-current',
          loading:
            'border-l-slate-500 dark:border-l-slate-400',
          default:
            'border-l-violet-500 dark:border-l-violet-400',
          actionButton:
            'rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200',
          cancelButton:
            'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#070712] dark:text-slate-200 dark:hover:bg-slate-900',
          closeButton:
            'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-[#070712] dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200',
        },
      }}
    />
  )
}
