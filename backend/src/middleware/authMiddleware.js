import { isSupabaseConfigured, supabase } from '../config/supabase.js'

export const protect = async (req, res, next) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ message: 'Authentication is not configured on the server.' })
  }

  const accessToken = req.cookies['sb-access-token']
  if (!accessToken) return res.status(401).json({ message: 'Not authenticated.' })

  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return res.status(401).json({ message: 'Session expired.' })

  req.user = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
    role: data.user.user_metadata?.role || 'CITIZEN',
    emailVerified: Boolean(data.user.email_confirmed_at),
  }
  next()
}

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' })
  }
  next()
}
