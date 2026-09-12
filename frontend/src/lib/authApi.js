const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionStorage.getItem('accessToken') && { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }),
      ...options.headers,
    },
  })
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
