const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.errors?.[0] || 'Something went wrong.')
  return data
}

export const authApi = {
  me: () => request('/auth/me'),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (profile) => request('/auth/register', { method: 'POST', body: JSON.stringify(profile) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
}
