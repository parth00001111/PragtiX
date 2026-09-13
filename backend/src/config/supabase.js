import './env.js'
import { createClient } from '@supabase/supabase-js'

const configuredSupabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseUrl = configuredSupabaseUrl
  ? new URL(configuredSupabaseUrl).origin
  : undefined
const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
}

if (configuredSupabaseUrl && configuredSupabaseUrl !== supabaseUrl) {
  console.warn('SUPABASE_URL should contain only the project origin; its path was removed automatically.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
