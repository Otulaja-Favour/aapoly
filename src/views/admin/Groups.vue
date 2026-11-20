<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import {
  clearGroups,
  createGroup,
  listGroups,
  listProjects,
  listStudents,
  seedProjects,
  setStudentGroup
} from '@/lib/api'
import { buildGroups } from '@/lib/grouping'
import { PROJECTS } from '@/data/projects'
import { toast } from '@/lib/toast'

const students = ref([])
const projects = ref([])
const savedGroups = ref([])

const loading = ref(true)
const publishing = ref(false)
const preview = ref([])

const mode = ref('count') // count | size
const groupCount = ref(5)
const groupSize = ref(4)

const value = computed(() => (mode.value === 'count' ? groupCount.value : groupSize.value))

// v-model cannot bind a ternary, so we expose a writable computed for the input.
const amount = computed({
  get: () => value.value,
  set: (next) => {
    if (mode.value === 'count') groupCount.value = next
    else groupSize.value = next
  }
})

const savedMembers = (id) => students.value.filter((s) => s.group_id === id)
const savedProjectName = (id) => projects.value.find((p) => p.id === id)?.name || 'No project'

async function load() {
  try {
    let [s, p, g] = await Promise.all([listStudents(), listProjects(), listGroups()])
    // Make sure the catalogue exists before we try to assign from it.
    if (!p || !p.length) {
      await seedProjects(PROJECTS)
      p = await listProjects()
    }
    students.value = s || []
    projects.value = p || []
    savedGroups.value = g || []
  } catch (err) {
    toast.error(err.message || 'Could not load grouping data.')
  } finally {
    loading.value = false
  }
}

function generate() {
  if (students.value.length < 2) {
    toast.error('Add at least two students before generating groups.')
    return
  }
  const options =
    mode.value === 'count' ? { groupCount: Number(groupCount.value) } : { groupSize: Number(groupSize.value) }
  preview.value = buildGroups(students.value, projects.value, options)
  toast.info(`Shuffled ${students.value.length} students into ${preview.value.length} groups.`)
}

async function publish() {
  if (!preview.value.length) return
  publishing.value = true
  try {
    // Deleting groups nulls each student's group_id (FK on delete set null).
    await clearGroups()
    for (const group of preview.value) {
      const created = await createGroup({ name: group.name, project_id: group.project?.id || null })
      const groupId = created?.id || created?.group?.id
      for (const member of group.students) {
        await setStudentGroup(member.id, groupId)
      }
    }
    preview.value = []
    await load()
    toast.success('Assignments published. Students can now check their groups.')
  } catch (err) {
    toast.error(err.message || 'Could not publish assignments.')
  } finally {
    publishing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="stack page">
    <ConfigNotice />

    <section class="card controls">
      <div class="controls-head">
        <h3>Generate random groups</h3>
        <p class="muted">
          {{ students.length }} student{{ students.length === 1 ? '' : 's' }} · {{ projects.length }}
          project{{ projects.length === 1 ? '' : 's' }} available
        </p>
      </div>

      <div class="controls-row">
        <div class="segmented">
          <button
            type="button"
            :class="{ active: mode === 'count' }"
            @click="mode = 'count'"
          >
            Number of groups
          </button>
          <button type="button" :class="{ active: mode === 'size' }" @click="mode = 'size'">
            Students per group
          </button>
        </div>

        <div class="field amount">
          <label>{{ mode === 'count' ? 'How many groups?' : 'Students per group' }}</label>
          <input
            v-model.number="amount"
            class="input"
            type="number"
            min="1"
            :max="mode === 'count' ? students.length : 50"
          />
        </div>

        <div class="controls-actions">
          <BaseButton :disabled="loading" @click="generate">
            {{ preview.length ? 'Re-shuffle' : 'Generate groups' }}
          </BaseButton>
        </div>
      </div>

      <p v-if="mode === 'count'" class="muted hint">
        {{ value }} group{{ value === 1 ? '' : 's' }} · about
        {{ students.length ? Math.ceil(students.length / Math.max(value, 1)) : 0 }} students each
      </p>
      <p v-else class="muted hint">
        About {{ students.length ? Math.ceil(students.length / Math.max(value, 1)) : 0 }} groups of
        up to {{ value }}
      </p>
    </section>

    <Transition name="fade">
      <section v-if="preview.length" class="card preview">
        <div class="preview-head">
          <div>
            <h3>Preview</h3>
            <p class="muted">Nothing is saved until you publish.</p>
          </div>
          <div class="preview-actions">
            <BaseButton variant="secondary" @click="generate">Shuffle again</BaseButton>
            <BaseButton :loading="publishing" @click="publish">Publish assignments</BaseButton>
          </div>
        </div>

        <div class="group-grid">
          <article v-for="group in preview" :key="group.name" class="group">
            <div class="group-head">
              <h4>{{ group.name }}</h4>
              <span class="badge brand">{{ group.project?.name || 'No project' }}</span>
            </div>
            <ul>
              <li v-for="member in group.students" :key="member.id">
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
    </Transition>

    <section v-if="savedGroups.length" class="card saved">
      <div class="saved-head">
        <div>
          <h3>Published groups</h3>
          <p class="muted">Live for students right now.</p>
        </div>
      </div>
      <div class="group-grid">
        <article v-for="group in savedGroups" :key="group.id" class="group">
          <div class="group-head">
            <h4>{{ group.name }}</h4>
            <span class="badge brand">{{ savedProjectName(group.project_id) }}</span>
          </div>
          <ul>
            <li v-for="member in savedMembers(group.id)" :key="member.id">
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
  </div>
</template>

<style scoped>
.page {
  gap: 20px;
}

.controls {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.controls-head h3 {
  font-size: 18px;
}
.controls-head p {
  margin: 2px 0 0;
  font-size: 13.5px;
}

.controls-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.segmented {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius);
  background: var(--surface-2);
}
.segmented button {
  padding: 9px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.segmented button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.amount {
  width: 190px;
}

.controls-actions {
  margin-left: auto;
}

.hint {
  margin: 0;
  font-size: 13.5px;
}

.preview,
.saved {
  padding: 22px;
}
.preview-head,
.saved-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.preview-head h3,
.saved-head h3 {
  font-size: 18px;
}
.preview-head p,
.saved-head p {
  margin: 2px 0 0;
  font-size: 13.5px;
}
.preview-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
}

.group {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  background: var(--surface);
}

.group-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}
.group-head h4 {
  font-size: 16px;
}

.group ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.group li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}
.group li:last-child {
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 640px) {
  .controls-actions {
    margin-left: 0;
    width: 100%;
  }
  .amount {
    width: 100%;
  }
}
</style>
