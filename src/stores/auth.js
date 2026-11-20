import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// The admin area is protected by a single passcode (not per-user accounts).
// AfriBase's email confirmation would otherwise block every sign-in, and the
// class tool only ever has one operator, so a local gate is enough.
const PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || ''
const STORAGE_KEY = 'aapoly.admin.session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))

  function ready() {
    if (!initialized.value) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) user.value = JSON.parse(raw)
      } catch {
        user.value = null
      }
      initialized.value = true
    }
    return Promise.resolve()
  }

  async function signIn({ passcode }) {
    loading.value = true
    try {
      if (!PASSCODE) {
        throw new Error(
          'No admin passcode is configured. Set VITE_ADMIN_PASSCODE in your .env file.'
        )
      }
      if (passcode !== PASSCODE) {
        throw new Error('Incorrect passcode.')
      }
      user.value = { role: 'admin', since: Date.now() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      return user.value
    } finally {
      loading.value = false
    }
  }

  function signOut() {
    user.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  return { user, loading, isAuthenticated, ready, signIn, signOut }
})
