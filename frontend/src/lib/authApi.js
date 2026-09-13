const localApiUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5001/api`
  : 'http://localhost:5001/api'
const API_URL = import.meta.env.VITE_API_URL || localApiUrl

const request = async (path, options = {}) => {
<<<<<<< HEAD
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    throw new Error(`Cannot reach the authentication server at ${API_URL}. Make sure the backend is running.`)
  }
=======
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionStorage.getItem('accessToken') && { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }),
      ...options.headers,
    },
  })
>>>>>>> origin/main
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.errors?.[0]?.message || data.message || 'Something went wrong.')
  return data
}

export const authApi = {
  me: async () => {
    if (!sessionStorage.getItem('refreshToken')) return { user: null }
    const { data } = await request('/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken: sessionStorage.getItem('refreshToken') }),
    })
    sessionStorage.setItem('accessToken', data.accessToken)
    const profile = await request('/auth/me')
    return { user: profile.data }
  },
  login: async (credentials) => {
    const { data } = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
    sessionStorage.setItem('accessToken', data.accessToken)
    sessionStorage.setItem('refreshToken', data.refreshToken)
    return { user: data.user }
  },
  register: (profile) => request('/auth/register', { method: 'POST', body: JSON.stringify(profile) }),
  logout: async () => {
    try {
      return await request('/auth/logout', {
        method: 'POST', body: JSON.stringify({ refreshToken: sessionStorage.getItem('refreshToken') }),
      })
    } finally {
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
    }
  },
}
