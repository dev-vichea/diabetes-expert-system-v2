import { AppRouter } from './app/router'
import { Toaster } from '@/components/ui'

function App() {
  return (
    <>
      <AppRouter />
      <Toaster richColors />
    </>
  )
}

export default App
