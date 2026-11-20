import { createClient } from '@afribase/afribase-js'

const url = import.meta.env.VITE_AFRIBASE_URL
const anonKey = import.meta.env.VITE_AFRIBASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

if (!isConfigured) {
  // Surfaced in the UI so the app explains itself instead of failing silently.
  console.warn(
    '[AfriBase] Missing VITE_AFRIBASE_URL / VITE_AFRIBASE_ANON_KEY. Copy .env.example to .env and fill in your project credentials.'
  )
}

export const afribase = createClient(url || 'http://localhost', anonKey || 'anon')
