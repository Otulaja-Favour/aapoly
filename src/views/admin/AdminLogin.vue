<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import Logo from '@/components/Logo.vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/lib/toast'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const passcode = ref('')

async function submit() {
  if (!passcode.value) {
    toast.error('Enter the admin passcode.')
    return
  }
  try {
    await auth.signIn({ passcode: passcode.value })
    toast.success('Welcome back.')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/panel'
    router.replace(redirect)
  } catch (err) {
    toast.error(err.message || 'Sign in failed.')
  }
}
</script>

<template>
  <div class="page">
    <main class="wrap">
      <ConfigNotice />

      <div class="card panel">
        <RouterLink class="brand" to="/">
          <Logo />
        </RouterLink>

        <h1>Admin sign in</h1>
        <p class="muted sub">Enter the admin passcode to manage the class list, groups and projects.</p>

        <form class="stack form" @submit.prevent="submit">
          <div class="field">
            <label for="passcode">Passcode</label>
            <input
              id="passcode"
              v-model="passcode"
              class="input"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>
          <BaseButton type="submit" block :loading="auth.loading">Sign in</BaseButton>
        </form>

        <RouterLink class="student-link" to="/student">
          Are you a student? Go to the student portal →
        </RouterLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
}

.wrap {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

h1 {
  font-size: 25px;
}
.sub {
  margin: 0 0 6px;
  font-size: 14.5px;
}

.form {
  gap: 16px;
  margin-top: 6px;
}

.student-link {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--brand);
  font-weight: 600;
}
</style>
