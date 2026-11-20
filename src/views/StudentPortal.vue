<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import { findStudentByMatric, listGroups, listProjects, listStudents } from '@/lib/api'
import { toast } from '@/lib/toast'

const matric = ref('')
const loading = ref(false)
const searched = ref(false)

const student = ref(null)
const allGroups = ref([])
const allProjects = ref([])

const myGroup = computed(
  () => allGroups.value.find((g) => g.id === student.value?.group_id) || null
)
const teammates = computed(() => myGroup.value?.members || [])

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
          <span class="brand-mark">A</span>
          <span class="brand-name">AAPoly</span>
        </RouterLink>
        <RouterLink class="back" to="/">← Back home</RouterLink>
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
            v-model="matric"
            class="input"
            placeholder="e.g. AAP/2021/0456"
            autocomplete="off"
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
              <p v-if="myGroup.project && myGroup.project.repo_folder" class="repo">
                Starter code: <code>{{ myGroup.project.repo_folder }}</code>
              </p>
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
              :class="{ highlight: group.id === student.group_id }"
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
.back {
  font-size: 14.5px;
  color: var(--muted);
}
.back:hover {
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

.repo {
  font-size: 13.5px;
}
.repo code,
code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface-2);
  font-size: 12.5px;
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
