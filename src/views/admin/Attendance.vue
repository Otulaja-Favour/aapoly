<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import { listAttendance, listStudents, setAttendance } from '@/lib/api'
import { departmentFromMatric, isLastYear } from '@/lib/departments'
import { toast } from '@/lib/toast'

const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1)

const students = ref([])
const attendance = ref([])
const loading = ref(true)
const saving = ref(false)

// '' until a year is picked; marking is gated behind this choice.
const yearFilter = ref('')

const cohortStudents = computed(() =>
  students.value.filter((s) =>
    yearFilter.value === 'last' ? isLastYear(s.matric_number) : !isLastYear(s.matric_number)
  )
)
const yearCounts = computed(() => ({
  current: students.value.filter((s) => !isLastYear(s.matric_number)).length,
  last: students.value.filter((s) => isLastYear(s.matric_number)).length
}))

const byKey = computed(() => {
  const map = {}
  for (const row of attendance.value) map[`${row.student_id}:${row.week}`] = row.present
  return map
})

const presentCount = (studentId) =>
  WEEKS.filter((w) => byKey.value[`${studentId}:${w}`]).length

async function load() {
  try {
    const [s, a] = await Promise.all([listStudents(), listAttendance()])
    students.value = (s || []).slice().sort((a, b) => a.full_name.localeCompare(b.full_name))
    attendance.value = a || []
  } catch (err) {
    toast.error(err.message || 'Could not load attendance.')
  } finally {
    loading.value = false
  }
}

async function toggle(student, week) {
  const key = `${student.id}:${week}`
  const next = !byKey.value[key]
  // Optimistic update.
  attendance.value = attendance.value.filter((r) => !(r.student_id === student.id && r.week === week))
  attendance.value.push({ student_id: student.id, week, present: next })
  try {
    await setAttendance(student.id, week, next)
  } catch (err) {
    toast.error(err.message || 'Could not save attendance.')
    load()
  }
}

async function markAllPresent(week) {
  saving.value = true
  try {
    await Promise.all(cohortStudents.value.map((s) => setAttendance(s.id, week, true)))
    await load()
    toast.success(`Week ${week} marked present for all ${cohortStudents.value.length} students.`)
  } catch (err) {
    toast.error(err.message || 'Could not mark attendance.')
  } finally {
    saving.value = false
  }
}

const totalPresent = computed(() =>
  cohortStudents.value.reduce((sum, s) => sum + presentCount(s.id), 0)
)
const totalPossible = computed(() => cohortStudents.value.length * WEEKS.length)

onMounted(load)
</script>

<template>
  <div class="stack page">
    <ConfigNotice />

    <section class="card head">
      <div>
        <h3>Attendance · 12 weeks</h3>
        <p class="muted">
          First choose which year you're marking, then click a cell to toggle present / absent.
          Green = present, grey = absent.
        </p>
      </div>
      <p v-if="yearFilter" class="muted rate">
        {{ totalPresent }} / {{ totalPossible }} check-ins
        ({{ totalPossible ? Math.round((totalPresent / totalPossible) * 100) : 0 }}%)
      </p>
    </section>

    <section class="card choose">
      <div class="choose-head">
        <span class="step-label">Step 1 · Choose a year</span>
        <p v-if="!yearFilter" class="muted">Pick a year to load its attendance sheet.</p>
        <p v-else class="muted">
          Marking <strong>{{ yearFilter === 'last' ? 'last year (HND)' : 'this year' }}</strong> ·
          {{ cohortStudents.length }} student{{ cohortStudents.length === 1 ? '' : 's' }}
        </p>
      </div>
      <div class="year-tabs" role="tablist">
        <button
          type="button"
          class="year-tab"
          :class="{ active: yearFilter === 'current' }"
          @click="yearFilter = 'current'"
        >
          This year ({{ yearCounts.current }})
        </button>
        <button
          type="button"
          class="year-tab"
          :class="{ active: yearFilter === 'last' }"
          @click="yearFilter = 'last'"
        >
          Last year ({{ yearCounts.last }})
        </button>
      </div>
    </section>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="!students.length" class="muted">No students in the class list yet.</p>
    <p v-else-if="!yearFilter" class="muted pad-hint">
      Choose a year above to start marking attendance.
    </p>
    <p v-else-if="!cohortStudents.length" class="muted pad-hint">
      No {{ yearFilter === 'last' ? 'last-year' : 'this-year' }} students in the class list.
    </p>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="sticky">Student</th>
            <th
              v-for="week in WEEKS"
              :key="week"
              class="week"
              :title="`Week ${week} — click to mark all present`"
            >
              <button type="button" class="week-head" @click="markAllPresent(week)">
                W{{ week }}
              </button>
            </th>
            <th class="count">Count</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in cohortStudents" :key="student.id">
            <td class="sticky">
              <span class="name">{{ student.full_name }}</span>
              <span class="faint matric">
                {{ student.matric_number }}<template v-if="departmentFromMatric(student.matric_number)"> · {{ departmentFromMatric(student.matric_number) }}</template>
              </span>
            </td>
            <td v-for="week in WEEKS" :key="week" class="cell">
              <button
                type="button"
                class="dot"
                :class="{ on: byKey[`${student.id}:${week}`] }"
                :title="`${student.full_name} · Week ${week} — ${byKey[`${student.id}:${week}`] ? 'Present' : 'Absent'}`"
                @click="toggle(student, week)"
              />
            </td>
            <td class="count">{{ presentCount(student.id) }}/{{ WEEKS.length }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page {
  gap: 20px;
}

.head {
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.head h3 {
  font-size: 18px;
}
.head p {
  margin: 4px 0 0;
  font-size: 13.5px;
}
.rate {
  font-weight: 600;
}

.choose {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.choose-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.choose-head p {
  margin: 0;
  font-size: 13.5px;
}
.step-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--faint);
}
.year-tabs {
  display: inline-flex;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  padding: 3px;
  gap: 2px;
}
.year-tab {
  border: none;
  background: transparent;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--faint);
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  white-space: nowrap;
}
.year-tab.active {
  background: var(--brand, #2563eb);
  color: #fff;
}
.pad-hint {
  padding: 18px 2px;
  font-size: 14px;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th,
.table td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.table th {
  background: var(--surface-2);
  font-weight: 600;
  font-size: 12px;
  color: var(--muted);
}
.sticky {
  position: sticky;
  left: 0;
  background: var(--surface);
  text-align: left;
  z-index: 1;
  min-width: 200px;
}
thead .sticky {
  background: var(--surface-2);
  z-index: 2;
}
.name {
  display: block;
  font-weight: 600;
}
.matric {
  font-size: 11.5px;
}
.week-head {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
}
.week-head:hover {
  background: var(--surface);
  color: var(--text);
}
.cell {
  padding: 6px;
}
.dot {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.dot.on {
  background: var(--success, #2e7d32);
  border-color: var(--success, #2e7d32);
}
.count {
  font-weight: 600;
  color: var(--muted);
}
</style>
