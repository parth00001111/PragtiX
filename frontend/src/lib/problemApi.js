const localApiUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5001/api`
  : 'http://localhost:5001/api'
const API_URL = import.meta.env.VITE_API_URL || localApiUrl

const authHeaders = () => sessionStorage.getItem('accessToken')
  ? { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }
  : {}

const readBody = response => response.json().catch(() => ({}))
const errorFrom = data => new Error(data.errors?.[0]?.message || data.message || 'Something went wrong.')
let refreshPromise = null

const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('Your session has expired. Please sign in again.')

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then(async response => {
      const data = await readBody(response)
      if (!response.ok || !data.data?.accessToken) throw errorFrom(data)
      sessionStorage.setItem('accessToken', data.data.accessToken)
      return data.data.accessToken
    }).catch(error => {
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
      throw new Error(error.message || 'Your session has expired. Please sign in again.')
    }).finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

const authenticatedFetch = async (path, options = {}) => {
  const send = () => fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })

  let response = await send()
  if (response.status === 401) {
    const data = await readBody(response)
    if (/token expired/i.test(data.message || '')) {
      await refreshAccessToken()
      response = await send()
    } else {
      throw errorFrom(data)
    }
  }

  const data = await readBody(response)
  if (!response.ok) throw errorFrom(data)
  return data
}

const publicFetch = async path => {
  const response = await fetch(`${API_URL}${path}`)
  const data = await readBody(response)
  if (!response.ok) throw errorFrom(data)
  return data
}

export const problemApi = {
  listPublic: (filters = {}) => {
    const query = new URLSearchParams({ limit: '100', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) })
    return publicFetch(`/problems/public?${query}`)
  },
  listMine: () => authenticatedFetch('/problems/mine?limit=100'),
  list: (filters = {}) => {
    const query = new URLSearchParams({ limit: '100', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) })
    return authenticatedFetch(`/problems?${query}`)
  },
  create: formData => authenticatedFetch('/problems', { method: 'POST', body: formData }),
  listIdeas: id => publicFetch(`/problems/public/${id}/ideas`),
  listMyIdeas: () => authenticatedFetch('/problems/ideas/mine'),
  submitIdea: (id, data) => authenticatedFetch(`/problems/${id}/ideas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
}
