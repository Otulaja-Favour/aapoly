<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/lib/toast'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const drawerOpen = ref(false)

const links = [
  {
    name: 'admin-dashboard',
    label: 'Dashboard',
    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'
  },
  {
    name: 'admin-students',
    label: 'Students',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'
  },
  {
    name: 'admin-groups',
    label: 'Groups',
    icon: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
  },
  {
    name: 'admin-projects',
    label: 'Projects',
    icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'
  }
]

const label = computed(() => (auth.user?.role === 'admin' ? 'Administrator' : 'admin'))
const pageTitle = computed(
  () => links.find((l) => l.name === route.name)?.label || 'Admin'
)

async function logout() {
  await auth.signOut()
  toast.info('Signed out.')
  router.replace({ name: 'admin-login' })
}
</script>

<template>
  <div class="shell">
    <div v-if="drawerOpen" class="scrim" @click="drawerOpen = false" />

    <aside class="sidebar" :class="{ open: drawerOpen }">
      <RouterLink class="side-brand" to="/admin" @click="drawerOpen = false">
        <span class="brand-mark">A</span>
        <span class="brand-name">AAPoly</span>
      </RouterLink>

      <nav class="side-nav">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          class="side-link"
          :to="{ name: link.name }"
          @click="drawerOpen = false"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="link.icon" />
          </svg>
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <div class="side-foot">
        <span class="side-email" :title="label">{{ label }}</span>
        <button type="button" class="logout" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button type="button" class="hamburger" @click="drawerOpen = true" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <h1 class="topbar-title">{{ pageTitle }}</h1>
      </header>

      <div class="content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  background: var(--bg);
}

.sidebar {
  width: 248px;
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
}

.side-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 20px;
}
.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-family: var(--font-heading);
  font-weight: 700;
}
.brand-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 17px;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--muted);
  font-size: 14.5px;
  font-weight: 500;
}
.side-link svg {
  width: 19px;
  height: 19px;
  flex: none;
}
.side-link:hover {
  background: var(--surface-2);
  color: var(--text);
}
.side-link.router-link-exact-active {
  background: var(--brand-soft);
  color: var(--brand-strong);
  font-weight: 600;
}

.side-foot {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-email {
  font-size: 13px;
  color: var(--faint);
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--muted);
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}
.logout svg {
  width: 19px;
  height: 19px;
}
.logout:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 28px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 5;
}

.topbar-title {
  font-size: 19px;
}

.hamburger {
  display: none;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  align-items: center;
  justify-content: center;
}
.hamburger svg {
  width: 20px;
  height: 20px;
}

.content {
  flex: 1;
  padding: 28px;
  max-width: 1200px;
  width: 100%;
}

.scrim {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow-lg);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(17, 20, 35, 0.4);
    z-index: 15;
  }
  .hamburger {
    display: inline-flex;
  }
  .topbar,
  .content {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
