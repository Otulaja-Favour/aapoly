<script setup>
import { computed, nextTick, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import Logo from '@/components/Logo.vue'
import { findStudentByMatric, listGroups, listProjects, listStudents } from '@/lib/api'
import { toast } from '@/lib/toast'

const matric = ref('')
const loading = ref(false)
const searched = ref(false)

// ND matric:  FH-XXX-25-0001      → groups [2, 3, 2, 4]
// HND matric: HND24-01-04-0001    → groups [5, 2, 2, 4]
const ND_GROUPS = [2, 3, 2, 4]
const HND_GROUPS = [5, 2, 2, 4]

/** Uppercases the input and inserts the hyphens as they type, for both shapes. */
function formatMatric(value) {
  const clean = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  const groups = clean.startsWith('HND') ? HND_GROUPS : ND_GROUPS
  const parts = []
  let index = 0
  for (const size of groups) {
    if (index >= clean.length) break
    parts.push(clean.slice(index, index + size))
    index += size
  }
  if (index < clean.length) parts.push(clean.slice(index))
  return parts.join('-')
}

async function onMatricInput(event) {
  const el = event.target
  const caret = el.selectionStart ?? el.value.length
  const typedBefore = (el.value.slice(0, caret).match(/[A-Za-z0-9]/g) || []).length
  const formatted = formatMatric(el.value)

  matric.value = formatted
  await nextTick()

  if (el.value !== formatted) el.value = formatted

  let seen = 0
  let position = formatted.length
  for (let i = 0; i < formatted.length; i += 1) {
    if (seen === typedBefore) {
      position = i
      break
    }
    if (/[A-Z0-9]/.test(formatted[i])) seen += 1
  }
  el.setSelectionRange(position, position)
}

const student = ref(null)
const allGroups = ref([])
const allProjects = ref([])

const myGroup = computed(
  () => allGroups.value.find((g) => g.id === student.value?.group_id) || null
)
const teammates = computed(() => myGroup.value?.members || [])

// Certificate is ready when the admin manually approved it (last-year / no-project
// students) or when the student's group project was marked complete.
const certificateReady = computed(
  () => Boolean(student.value?.certificate_approved || myGroup.value?.project_approved)
)

async function lookup() {
  const query = matric.value.trim()
  if (!query) {
    toast.error('Enter your matric number first.')
    return
  }

  loading.value = true
  searched.value = false
  try {
    const [found, groups, students, projects] = await Promise.all([
      findStudentByMatric(query),
      listGroups(),
      listStudents(),
      listProjects()
    ])

    student.value = found
    allProjects.value = projects || []
    allGroups.value = (groups || [])
      .map((group) => ({
        ...group,
        project: (projects || []).find((p) => p.id === group.project_id) || null,
        members: (students || []).filter((s) => s.group_id === group.id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  } catch (err) {
    toast.error(err.message || 'Could not reach the server.')
  } finally {
    loading.value = false
    searched.value = true
  }
}

function reset() {
  matric.value = ''
  student.value = null
  allGroups.value = []
  allProjects.value = []
  searched.value = false
}
</script>

<template>
  <div class="page">
    <header class="nav">
      <div class="wrap nav-inner">
        <RouterLink class="brand" to="/">
          <Logo />
        </RouterLink>
        <RouterLink class="back" to="/" aria-label="Back home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </RouterLink>
      </div>
    </header>

    <main class="wrap main">
      <ConfigNotice />

      <div class="head">
        <h1>Student portal</h1>
        <p class="muted">
          Enter your matric number to find your group, and browse every project and group in the class.
        </p>
      </div>

      <form class="search card" @submit.prevent="lookup">
        <div class="field">
          <label for="matric">Matric number</label>
          <input
            id="matric"
            :value="matric"
            class="input"
            placeholder="e.g. FH-SWD-25-0001 or HND24-01-04-0001"
            autocomplete="off"
            spellcheck="false"
            @input="onMatricInput"
          />
        </div>
        <BaseButton type="submit" :loading="loading">See my group</BaseButton>
      </form>

      <Transition name="fade">
        <section v-if="searched && !student" class="empty card">
          <h3>No match found</h3>
          <p class="muted">
            We couldn't find <strong>{{ matric }}</strong> in the class list. Double-check the matric
            number with your lecturer.
          </p>
          <BaseButton variant="secondary" size="sm" @click="reset">Try again</BaseButton>
        </section>
      </Transition>

      <template v-if="student">
        <section v-if="myGroup" class="mine">
          <div class="mine-head">
            <span class="badge success">You're in</span>
            <h2>{{ myGroup.name }}</h2>
            <p class="muted">{{ student.full_name }} · {{ student.matric_number }}</p>
          </div>

          <div class="status-row">
            <span class="badge" :class="student.has_paid ? 'success' : 'warn'">
              {{ student.has_paid ? 'Payment received' : 'Payment pending' }}
            </span>
            <RouterLink
              v-if="certificateReady"
              :to="{ name: 'certificate', params: { matric: student.matric_number } }"
              class="cert-btn"
              target="_blank"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 13h6M9 17h6" />
              </svg>
              Download my certificate
            </RouterLink>
          </div>

          <div class="grid">
            <article class="card panel">
              <span class="badge brand">Your project</span>
              <h3>{{ myGroup.project ? myGroup.project.name : 'To be announced' }}</h3>
              <p v-if="myGroup.project" class="muted">{{ myGroup.project.description }}</p>
              <div v-if="myGroup.project" class="tags">
                <span v-if="myGroup.project.difficulty" class="badge">
                  {{ myGroup.project.difficulty }}
                </span>
                <span v-for="tag in myGroup.project.tags || []" :key="tag" class="badge">{{ tag }}</span>
              </div>
              <a
                v-if="myGroup.project"
                :href="`/downloads/${myGroup.project.slug}.zip`"
                class="download-btn"
                :download="`${myGroup.project.slug}.zip`"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download project files
              </a>
            </article>

            <article class="card panel">
              <span class="badge">Your teammates ({{ teammates.length }})</span>
              <ul class="members">
                <li v-for="mate in teammates" :key="mate.id">
                  <span class="avatar">{{ mate.full_name.charAt(0).toUpperCase() }}</span>
                  <span class="who">
                    <span class="name">
                      {{ mate.full_name }}
                      <span v-if="mate.id === student.id" class="you">you</span>
                    </span>
                    <span class="faint matric">{{ mate.matric_number }}</span>
                  </span>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section v-else class="empty card">
          <h3>Hi {{ student.full_name.split(' ')[0] }} 👋</h3>
          <p class="muted">
            You're on the class list, but your group hasn't been published yet. Meanwhile you can
            see all the projects below.
          </p>
          <div class="status-row">
            <span class="badge" :class="student.has_paid ? 'success' : 'warn'">
              {{ student.has_paid ? 'Payment received' : 'Payment pending' }}
            </span>
            <RouterLink
              v-if="certificateReady"
              :to="{ name: 'certificate', params: { matric: student.matric_number } }"
              class="cert-btn"
              target="_blank"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 13h6M9 17h6" />
              </svg>
              Download my certificate
            </RouterLink>
          </div>
        </section>

        <section class="block">
          <div class="block-head">
            <h3>All groups</h3>
            <span class="muted">{{ allGroups.length }} group{{ allGroups.length === 1 ? '' : 's' }}</span>
          </div>
          <p v-if="!allGroups.length" class="muted">No groups have been published yet.</p>
          <div v-else class="group-grid">
            <article
              v-for="group in allGroups"
              :key="group.id"
              class="card group"
              :class="{ highlight: group.id === student.group_id, dim: myGroup && group.id !== myGroup.id }"
            >
              <div class="group-head">
                <h4>
                  {{ group.name }}
                  <span v-if="group.id === student.group_id" class="badge success">yours</span>
                </h4>
                <span class="badge brand">{{ group.project?.name || 'No project' }}</span>
              </div>
              <ul class="members">
                <li v-for="member in group.members" :key="member.id">
                  <span class="avatar">{{ member.full_name.charAt(0).toUpperCase() }}</span>
                  <span class="who">
                    <span class="name">{{ member.full_name }}</span>
                    <span class="faint matric">{{ member.matric_number }}</span>
                  </span>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section class="block">
          <div class="block-head">
            <h3>All projects</h3>
            <span class="muted">{{ allProjects.length }} available</span>
          </div>
          <p v-if="!allProjects.length" class="muted">No projects have been added yet.</p>
          <div v-else class="project-grid">
            <article
              v-for="project in allProjects"
              :key="project.id"
              class="card project"
              :class="{ highlight: myGroup && project.id === myGroup.project_id }"
            >
              <div class="project-head">
                <h4>{{ project.name }}</h4>
                <span v-if="myGroup && project.id === myGroup.project_id" class="badge success">
                  assigned to you
                </span>
              </div>
              <p class="muted">{{ project.description }}</p>
              <div class="tags">
                <span v-if="project.difficulty" class="badge">{{ project.difficulty }}</span>
                <span v-for="tag in project.tags || []" :key="tag" class="badge">{{ tag }}</span>
              </div>
            </article>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
}

.wrap {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 0 24px;
}

.nav {
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.nav-inner {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  color: var(--muted);
  transition: background 0.15s ease, color 0.15s ease;
}
.back:hover {
  background: var(--surface-2);
  color: var(--text);
}

.main {
  padding-top: 40px;
  padding-bottom: 64px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.head h1 {
  font-size: 30px;
}
.head p {
  margin: 6px 0 0;
}

.search {
  padding: 20px;
  display: flex;
  align-items: flex-end;
  gap: 14px;
}
.search .field {
  flex: 1;
}

.empty {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
.empty p {
  margin: 0;
}

.mine {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.mine-head h2 {
  font-size: 26px;
  margin-top: 10px;
}
.mine-head p {
  margin: 4px 0 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.badge.warn {
  background: var(--warning-soft, #fff4e0);
  color: var(--warning, #b26a00);
}
.badge.success {
  background: var(--success-soft, #e3f7e8);
  color: var(--success, #1a7f37);
}
.cert-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius);
  background: var(--brand);
  color: var(--brand-contrast);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background 0.15s ease;
}
.cert-btn:hover {
  background: var(--brand-strong);
}

.grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 20px;
  align-items: start;
}

.panel {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel h3 {
  font-size: 20px;
}
.panel p {
  margin: 0;
  font-size: 14.5px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  margin-top: 4px;
  padding: 11px 18px;
  border-radius: var(--radius);
  background: var(--brand);
  color: var(--brand-contrast);
  font-weight: 600;
  font-size: 14.5px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease;
}
.download-btn:hover {
  background: var(--brand-strong);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.block-head h3 {
  font-size: 19px;
}

.group-grid,
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.group,
.project {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group.highlight,
.project.highlight {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-soft);
}

/* Other groups fade back so the student's own group stands out. */
.group.dim {
  opacity: 0.45;
  filter: grayscale(0.6);
  transition: opacity 0.15s ease, filter 0.15s ease;
}
.group.dim:hover {
  opacity: 1;
  filter: none;
}

.group-head,
.project-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.group-head h4,
.project-head h4 {
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.project p {
  margin: 0;
  font-size: 14px;
}

.members {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.members li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}
.members li:last-child {
  border-bottom: none;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand-strong);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-family: var(--font-heading);
  font-size: 13px;
  flex: none;
}

.who {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  min-width: 0;
}
.name {
  font-weight: 600;
  font-size: 14px;
}
.matric {
  font-size: 12px;
}

.you {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: var(--radius-pill);
  background: var(--brand-soft);
  color: var(--brand-strong);
  font-size: 11px;
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .search {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
