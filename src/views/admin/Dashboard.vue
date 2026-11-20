<script setup>
import { computed, onMounted, ref } from 'vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import StatCard from '@/components/StatCard.vue'
import { listGroups, listProjects, listStudents } from '@/lib/api'
import { PROJECTS } from '@/data/projects'
import { toast } from '@/lib/toast'

const loading = ref(true)
const students = ref([])
const groups = ref([])
const projects = ref([])

const unassigned = computed(
  () => students.value.filter((s) => !s.group_id).length
)
const projectName = (id) => projects.value.find((p) => p.id === id)?.name || '—'
const groupSize = (id) => students.value.filter((s) => s.group_id === id).length

onMounted(async () => {
  try {
    const [s, g, p] = await Promise.all([listStudents(), listGroups(), listProjects()])
    students.value = s || []
    groups.value = g || []
    projects.value = p || []
  } catch (err) {
    toast.error(err.message || 'Could not load dashboard data.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="stack page">
    <ConfigNotice />

    <section class="stats">
      <StatCard label="Students" :value="students.length" hint="uploaded to the class" />
      <StatCard label="Groups" :value="groups.length" accent="success" hint="generated so far" />
      <StatCard label="Projects" :value="projects.length || PROJECTS.length" accent="muted" hint="in the catalogue" />
      <StatCard label="Unassigned" :value="unassigned" accent="muted" hint="students with no group" />
    </section>

    <section class="actions">
      <RouterLink class="action card" :to="{ name: 'admin-students' }">
        <h3>Upload students</h3>
        <p class="muted">Add the class list by full name and matric number.</p>
        <span class="cta">Open →</span>
      </RouterLink>
      <RouterLink class="action card" :to="{ name: 'admin-groups' }">
        <h3>Generate groups</h3>
        <p class="muted">Shuffle the class into random teams and assign projects.</p>
        <span class="cta">Open →</span>
      </RouterLink>
      <RouterLink class="action card" :to="{ name: 'admin-projects' }">
        <h3>Project catalogue</h3>
        <p class="muted">Review the projects that can be handed out.</p>
        <span class="cta">Open →</span>
      </RouterLink>
    </section>

    <section v-if="groups.length" class="card table-card">
      <div class="table-head">
        <h3>Current groups</h3>
        <span class="muted">{{ groups.length }} total</span>
      </div>
      <ul class="group-list">
        <li v-for="group in groups" :key="group.id">
          <span class="g-name">{{ group.name }}</span>
          <span class="badge brand">{{ projectName(group.project_id) }}</span>
          <span class="muted g-size">{{ groupSize(group.id) }} members</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page {
  gap: 22px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
}

.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}

.action {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.action h3 {
  font-size: 17px;
}
.action p {
  margin: 0;
  font-size: 14px;
}
.cta {
  margin-top: 6px;
  font-weight: 600;
  color: var(--brand);
  font-size: 14px;
}

.table-card {
  padding: 20px 22px;
}
.table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.group-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--border);
}
.group-list li:last-child {
  border-bottom: none;
}
.g-name {
  font-weight: 600;
  min-width: 96px;
}
.g-size {
  margin-left: auto;
  font-size: 13.5px;
}
</style>
