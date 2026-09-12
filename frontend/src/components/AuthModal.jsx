import { useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import { authApi } from '../lib/authApi'

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const switchMode = (next) => { setMode(next); setError(''); setConfirmation('') }
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      if (mode === 'login') {
        const data = await authApi.login({ email: form.get('email'), password: form.get('password') })
        onAuthenticated(data.user); onClose()
      } else {
        const data = await authApi.register({ name: form.get('name'), email: form.get('email'), password: form.get('password'), role: form.get('role') })
        setConfirmation(data.message)
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close authentication"><X /></button>
      <div className="auth-brand"><span className="auth-icon"><LockKeyhole size={22} /></span><span>Secure access</span></div>
      {confirmation ? <div className="success-state"><CheckCircle2 size={48} /><h2>Account created</h2><p>{confirmation}</p><button className="primary" onClick={() => switchMode('login')}>Go to sign in</button></div> : <>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Create account</button></div>
        <h2 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Join the innovation network.'}</h2>
        <p>{mode === 'login' ? 'Sign in to manage challenges, teams and project progress.' : 'Create a verified profile to participate across Jharkhand.'}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && <label>Full name<input name="name" required minLength="2" autoComplete="name" placeholder="Your full name" /></label>}
          <label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label>Password<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {mode === 'signup' && <label>I am joining as<select name="role" defaultValue="CITIZEN"><option value="CITIZEN">Citizen / community member</option><option value="FACULTY">University / HEI representative</option><option value="INDUSTRY">Industry / startup partner</option></select></label>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary auth-submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} {!loading && <ArrowRight size={17} />}</button>
        </form>
        <small className="auth-note">By continuing, you agree to the portal terms and privacy policy.</small>
      </>}
    </div>
  </div>
}
