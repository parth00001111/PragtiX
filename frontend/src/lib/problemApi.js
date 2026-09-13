const localApiUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5001/api`
  : 'http://localhost:5001/api'
const API_URL = import.meta.env.VITE_API_URL || localApiUrl

const authHeaders = () => sessionStorage.getItem('accessToken')
  ? { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }
  : {}

const parse = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.errors?.[0]?.message || data.message || 'Something went wrong.')
  return data
}

export const problemApi = {
  listMine: () => fetch(`${API_URL}/problems?limit=100`, { headers: authHeaders() }).then(parse),
  list: (filters = {}) => {
    const query = new URLSearchParams({ limit: '100', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) })
    return fetch(`${API_URL}/problems?${query}`, { headers: authHeaders() }).then(parse)
  },
  create: (formData) => fetch(`${API_URL}/problems`, { method: 'POST', headers: authHeaders(), body: formData }).then(parse),
}
