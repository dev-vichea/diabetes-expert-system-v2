import { Link } from 'react-router-dom'

export function UnauthorizedPage({ isAuthenticated = false }) {
  return (
    <section className="surface mx-auto max-w-2xl p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-danger-500">Access Control</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Unauthorized</h1>
      <p className="mt-2 text-sm text-slate-600">
        You do not have permission to access this page.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {isAuthenticated ? <Link to="/" className="btn-primary">Back to Dashboard</Link> : <Link to="/login" className="btn-primary">Go to Login</Link>}
      </div>
    </section>
  )
}
