import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
  { path: '/student', name: 'student', component: () => import('@/views/StudentPortal.vue') },
  {
    path: '/panel/login',
    name: 'admin-login',
    component: () => import('@/views/admin/AdminLogin.vue')
  },
  {
    path: '/panel',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'students', name: 'admin-students', component: () => import('@/views/admin/Students.vue') },
      { path: 'groups', name: 'admin-groups', component: () => import('@/views/admin/Groups.vue') },
      { path: 'projects', name: 'admin-projects', component: () => import('@/views/admin/Projects.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ready()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'admin-login' && auth.isAuthenticated) {
    return { name: 'admin-dashboard' }
  }
})

export default router
