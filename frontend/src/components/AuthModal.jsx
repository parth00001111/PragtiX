import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import { authApi } from '../lib/authApi'

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const switchMode = (next) => { setMode(next); setError('') }
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      if (mode === 'login') {
        const data = await authApi.login({ email: form.get('email'), password: form.get('password') })
        onAuthenticated(data.user); onClose()
      } else {
        const credentials = { email: form.get('email'), password: form.get('password') }
        await authApi.register({ name: form.get('name'), ...credentials, phone: form.get('phone') || undefined, role: form.get('role') })
        const data = await authApi.login(credentials)
        onAuthenticated(data.user); onClose()
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close authentication"><X /></button>
      <div className="auth-brand"><span className="auth-icon"><LockKeyhole size={22} /></span><span>Secure access</span></div>
      <>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Create account</button></div>
        <h2 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Join the innovation network.'}</h2>
        <p>{mode === 'login' ? 'Sign in to manage challenges, teams and project progress.' : 'Create a verified profile to participate across Jharkhand.'}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && <label>Full name<input name="name" required minLength="2" autoComplete="name" placeholder="Your full name" /></label>}
          {mode === 'signup' && <label>Mobile number <small>(optional)</small><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" pattern="[0-9+ -]{10,15}" /></label>}
          <label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label>Password<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {mode === 'signup' && <label>I am joining as<select name="role" defaultValue="CITIZEN"><option value="CITIZEN">Citizen / community member</option><option value="FACULTY">University / organisation administrator</option><option value="INDUSTRY">Innovation company / startup</option><option value="STUDENT">Organisation team member / researcher</option></select></label>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary auth-submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} {!loading && <ArrowRight size={17} />}</button>
        </form>
        <small className="auth-note">Aadhaar is never required. Government-approved identity verification may be offered only where appropriate. By continuing, you agree to the portal terms and privacy policy.</small>
      </>
    </div>
  </div>
}
