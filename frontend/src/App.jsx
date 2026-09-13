import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthModal from './components/AuthModal'
import AdminDashboard from './admin/AdminDashboard'
import { CitizenDashboard, ProblemSubmission } from './citizen/CitizenModule'
import OrganizationDashboard from './organization/OrganizationDashboard'
import InnovationLanding from './landing/InnovationLanding'
import { authApi } from './lib/authApi'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [dashboardVersion, setDashboardVersion] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => { authApi.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => {}) }, [])
  const authenticated = currentUser => { setUser(currentUser); setShowAuth(false); navigate('/') }
  const logout = async () => { try { await authApi.logout() } finally { setUser(null); navigate('/') } }
  const authModal = showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthenticated={authenticated} />

  if (location.pathname.startsWith('/admin')) return <AdminDashboard/>
  if (location.pathname.startsWith('/citizen')) {
    if (location.pathname === '/citizen/submit') return <ProblemSubmission standalone user={user} onClose={() => navigate(user ? '/citizen/problems' : '/')} onSubmitted={() => setDashboardVersion(value => value + 1)} />
    return <><CitizenDashboard key={dashboardVersion} user={user} path={location.pathname} onNavigate={navigate} onSignIn={() => setShowAuth(true)} onLogout={logout}/>{authModal}</>
  }
  if (location.pathname.startsWith('/organization')) return <><OrganizationDashboard user={user} path={location.pathname} onNavigate={navigate} onSignIn={() => setShowAuth(true)} onLogout={logout}/>{authModal}</>
  return <><InnovationLanding user={user} onNavigate={navigate} onSignIn={() => setShowAuth(true)} onLogout={logout}/>{authModal}</>
}
