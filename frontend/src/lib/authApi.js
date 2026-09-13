const localApiUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5001/api`
  : 'http://localhost:5001/api'
const API_URL = import.meta.env.VITE_API_URL || localApiUrl

const request = async (path, options = {}) => {
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
