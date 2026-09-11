import { loginSchema, registerSchema } from '../validations/authValidation.js'
import { isSupabaseConfigured, supabase } from '../config/supabase.js'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
}

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  role: user.user_metadata?.role || 'CITIZEN',
  emailVerified: Boolean(user.email_confirmed_at),
})

const setSessionCookies = (res, session) => {
  res.cookie('sb-access-token', session.access_token, {
    ...cookieOptions,
    maxAge: Math.max((session.expires_in || 3600) - 30, 60) * 1000,
  })
  res.cookie('sb-refresh-token', session.refresh_token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

const clearSessionCookies = (res) => {
  res.clearCookie('sb-access-token', cookieOptions)
  res.clearCookie('sb-refresh-token', cookieOptions)
}

const ensureConfigured = (res) => {
  if (isSupabaseConfigured) return true
  res.status(503).json({ message: 'Authentication is not configured on the server.' })
  return false
}

export const register = async (req, res) => {
  if (!ensureConfigured(res)) return
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues.map((e) => e.message) })
  }

  const { name, email, password, role } = parsed.data
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: role || 'CITIZEN' } },
  })

  if (error) return res.status(error.status || 400).json({ message: error.message })
  if (data.session) setSessionCookies(res, data.session)

  return res.status(201).json({
    user: data.user ? publicUser(data.user) : null,
    requiresEmailConfirmation: !data.session,
    message: data.session ? 'Account created successfully.' : 'Check your email to confirm your account.',
  })
}

export const login = async (req, res) => {
  if (!ensureConfigured(res)) return
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues.map((e) => e.message) })
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return res.status(error.status || 401).json({ message: error.message })

  setSessionCookies(res, data.session)
  return res.json({ user: publicUser(data.user) })
}

export const refresh = async (req, res) => {
  if (!ensureConfigured(res)) return
  const refreshToken = req.cookies['sb-refresh-token']
  if (!refreshToken) return res.status(401).json({ message: 'No active session.' })

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) {
    clearSessionCookies(res)
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }

  setSessionCookies(res, data.session)
  return res.json({ user: publicUser(data.user) })
}

export const logout = async (req, res) => {
  clearSessionCookies(res)
  return res.json({ message: 'Logged out successfully.' })
}

export { publicUser, setSessionCookies, clearSessionCookies }
