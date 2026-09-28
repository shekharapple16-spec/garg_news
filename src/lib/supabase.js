import { createClient } from '@supabase/supabase-js'

const getEnvValue = (name) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[name]
    if (value) {
      return value
    }
  }

  if (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env) {
    return globalThis.process.env[name]
  }

  return undefined
}

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
