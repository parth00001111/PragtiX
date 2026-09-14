const localApiUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5001/api`
  : 'http://localhost:5001/api'
const API_URL = import.meta.env.VITE_API_URL || localApiUrl

export async function sendChatMessage(message, history = []) {
  let response
  try {
    response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
  } catch {
    throw new Error('Samadhan Sahayak is temporarily offline. Please try again.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Unable to get an answer right now.')
  return body.data
}
