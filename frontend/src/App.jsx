import { useEffect } from 'react'
import { AppRouter } from './app/router'
import { Toaster } from '@/components/ui'

export default function App() {
  useEffect(() => {
    const root = document.documentElement
    const stored = window.localStorage.getItem('theme')
    const resolvedTheme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'

    root.classList.toggle('dark', resolvedTheme === 'dark')
  }, [])

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  )
}
