import { AppRouter } from './app/router'
// Import directly (not via the ui barrel) so recharts — pulled in by
// ui/chart.jsx through the barrel — stays out of the eagerly-loaded entry chunk.
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <AppRouter />
      <Toaster richColors />
    </>
  )
}

export default App
