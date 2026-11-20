<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { addStudents, clearStudents, deleteStudent, listGroups, listStudents } from '@/lib/api'
import { toast } from '@/lib/toast'

const raw = ref('')
const students = ref([])
const groups = ref([])
const search = ref('')
const loading = ref(true)
const adding = ref(false)
const clearing = ref(false)
const confirmClear = ref(false)
const pendingDelete = ref(null)
const deleting = ref(false)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return students.value
  return students.value.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q) ||
      s.matric_number.toLowerCase().includes(q)
  )
})

const groupName = (id) => groups.value.find((g) => g.id === id)?.name || '—'

async function load() {
  try {
    const [s, g] = await Promise.all([listStudents(), listGroups()])
    students.value = (s || []).slice().sort((a, b) => a.full_name.localeCompare(b.full_name))
    groups.value = g || []
  } catch (err) {
    toast.error(err.message || 'Could not load students.')
  } finally {
    loading.value = false
  }
}

/** Accepts "Full Name, Matric" (comma or tab) or "Full Name MATRIC" (last token). */
function parseList(text) {
  const rows = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let name = ''
    let matric = ''
    if (trimmed.includes(',') || trimmed.includes('\t')) {
      const parts = trimmed.split(/[,\t]+/).map((p) => p.trim()).filter(Boolean)
      name = parts[0] || ''
      matric = parts[1] || ''
    } else {
      const tokens = trimmed.split(/\s+/)
      if (tokens.length >= 2) {
        matric = tokens[tokens.length - 1]
        name = tokens.slice(0, -1).join(' ')
      }
    }
    if (name && matric) rows.push({ full_name: name, matric_number: matric })
  }
  return rows
}

async function addAll() {
  const parsed = parseList(raw.value)
  if (!parsed.length) {
    toast.error('Nothing to add. Use one student per line: "Full Name, Matric Number".')
    return
  }

  const seen = new Set()
  const unique = parsed.filter((r) => {
    const key = r.matric_number.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const existing = new Set(students.value.map((s) => s.matric_number.toLowerCase()))
  const fresh = unique.filter((r) => !existing.has(r.matric_number.toLowerCase()))
  const skipped = unique.length - fresh.length

  if (!fresh.length) {
    toast.info('Everyone on that list is already uploaded.')
    return
  }

  adding.value = true
  try {
    await addStudents(fresh)
    await load()
    raw.value = ''
    toast.success(
      `Added ${fresh.length} student${fresh.length === 1 ? '' : 's'}${
        skipped ? ` · skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}` : ''
      }.`
    )
  } catch (err) {
    toast.error(err.message || 'Could not add students.')
  } finally {
    adding.value = false
  }
}

async function remove() {
  const student = pendingDelete.value
  if (!student) return
  deleting.value = true
  try {
    await deleteStudent(student.id)
    students.value = students.value.filter((s) => s.id !== student.id)
    pendingDelete.value = null
    toast.info(`Removed ${student.full_name}.`)
  } catch (err) {
    toast.error(err.message || 'Could not remove student.')
  } finally {
    deleting.value = false
  }
}

async function clearAll() {
  clearing.value = true
  try {
    await clearStudents()
    students.value = []
    confirmClear.value = false
    toast.info('Class list cleared.')
  } catch (err) {
    toast.error(err.message || 'Could not clear the list.')
  } finally {
    clearing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="stack page">
    <ConfigNotice />

    <div class="cols">
      <section class="card add">
        <h3>Add students</h3>
        <p class="muted">
          One student per line as <strong>Full Name, Matric Number</strong>. You can paste straight
          from a spreadsheet.
        </p>
        <textarea
          v-model="raw"
          class="textarea"
          placeholder="Chidi Okafor, AAP/2021/0456&#10;Amina Bello, AAP/2021/0457&#10;Tunde Adeyemi AAP/2021/0458"
        />
        <div class="add-actions">
          <BaseButton :loading="adding" @click="addAll">Add to class list</BaseButton>
          <span class="faint">{{ parseList(raw).length }} detected</span>
        </div>
      </section>

      <section class="card roster">
        <div class="roster-head">
          <div>
            <h3>Class list</h3>
            <p class="muted">{{ students.length }} student{{ students.length === 1 ? '' : 's' }}</p>
          </div>
          <div class="roster-tools">
            <input v-model="search" class="input search" placeholder="Search name or matric…" />
            <BaseButton
              v-if="students.length"
              variant="danger"
              size="sm"
              @click="confirmClear = true"
            >
              Clear all
            </BaseButton>
          </div>
        </div>

        <p v-if="loading" class="muted pad">Loading…</p>
        <p v-else-if="!students.length" class="muted pad">
          No students yet. Paste your class list on the left.
        </p>
        <p v-else-if="!filtered.length" class="muted pad">No one matches “{{ search }}”.</p>

        <ul v-else class="roster-list">
          <li v-for="(student, index) in filtered" :key="student.id">
            <span class="idx">{{ index + 1 }}</span>
            <span class="who">
              <span class="name">{{ student.full_name }}</span>
              <span class="faint matric">{{ student.matric_number }}</span>
            </span>
            <span class="badge" :class="student.group_id ? 'brand' : ''">
              {{ student.group_id ? groupName(student.group_id) : 'Unassigned' }}
            </span>
            <button type="button" class="del" title="Remove" @click="pendingDelete = student">
              ✕
            </button>
          </li>
        </ul>
      </section>
    </div>

    <ConfirmModal
      :open="Boolean(pendingDelete)"
      title="Remove student?"
      :message="
        pendingDelete
          ? `${pendingDelete.full_name} (${pendingDelete.matric_number}) will be removed from the class list. This can't be undone.`
          : ''
      "
      confirm-label="Yes, remove"
      :loading="deleting"
      @confirm="remove"
      @cancel="pendingDelete = null"
    />

    <ConfirmModal
      :open="confirmClear"
      title="Clear the class list?"
      :message="`All ${students.length} students will be removed. This can't be undone.`"
      confirm-label="Yes, clear all"
      :loading="clearing"
      @confirm="clearAll"
      @cancel="confirmClear = false"
    />
  </div>
</template>

<style scoped>
.page {
  gap: 20px;
}

.cols {
  display: grid;
  grid-template-columns: minmax(300px, 380px) 1fr;
  gap: 20px;
  align-items: start;
}

.add {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.add h3 {
  font-size: 18px;
}
.add p {
  margin: 0;
  font-size: 14px;
}
.add-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.roster {
  padding: 22px;
}
.roster-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.roster-head h3 {
  font-size: 18px;
}
.roster-head p {
  margin: 2px 0 0;
  font-size: 13.5px;
}
.roster-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}
.search {
  width: 210px;
}

.pad {
  padding: 18px 2px;
  font-size: 14px;
}

.roster-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.roster-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.roster-list li:last-child {
  border-bottom: none;
}

.idx {
  width: 24px;
  font-size: 12.5px;
  color: var(--faint);
  flex: none;
}

.who {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  min-width: 0;
  flex: 1;
}
.name {
  font-weight: 600;
  font-size: 14.5px;
}
.matric {
  font-size: 12.5px;
}

.del {
  width: 30px;
  height: 30px;
  flex: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--faint);
  cursor: pointer;
  font-size: 14px;
}
.del:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

@media (max-width: 860px) {
  .cols {
    grid-template-columns: 1fr;
  }
  .search {
    width: 100%;
  }
  .roster-tools {
    width: 100%;
  }
}
</style>
