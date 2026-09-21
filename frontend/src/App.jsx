import { AppRouter } from './app/router'
// Import directly (not via the ui barrel) so recharts — pulled in by
// ui/chart.jsx through the barrel — stays out of the eagerly-loaded entry chunk.
import { Toaster } from '@/components/ui/sonner'
import { DiabetesAssistant } from '@/features/diabetes-assistant/DiabetesAssistant'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleAccess } from '@/hooks/useRoleAccess'

function App() {
  const { user } = useAuth()
  const { isPatient, canViewPatients } = useRoleAccess(user)
  const showPatientAssistant = Boolean(user) && isPatient && !canViewPatients

  return (
    <>
      <AppRouter />
      {showPatientAssistant && <DiabetesAssistant />}
      <Toaster richColors />
    </>
  )
}

export default App
