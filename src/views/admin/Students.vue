<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { addStudents, clearStudents, deleteStudent, listGroups, listStudents, markPaidByMatric, updateStudent } from '@/lib/api'
import { compareMatricNumbers, departmentFromMatric, isLastYear } from '@/lib/departments'
import { toast } from '@/lib/toast'

const raw = ref('')
const paidRaw = ref('')
const paidMethod = ref('company')
const students = ref([])
const groups = ref([])
const search = ref('')
const yearFilter = ref('all') // all | current | last
const departmentFilter = ref('all')
const paymentFilter = ref('all') // all | paid | unpaid
const loading = ref(true)
const adding = ref(false)
const clearing = ref(false)
const markingPaid = ref(false)
const confirmClear = ref(false)
const pendingDelete = ref(null)
const deleting = ref(false)

const groupName = (id) => groups.value.find((g) => g.id === id)?.name || '—'
const dept = (matricNumber) => departmentFromMatric(matricNumber)
const yearStudents = computed(() =>
  students.value.filter((s) => {
    if (yearFilter.value === 'current' && isLastYear(s.matric_number)) return false
    if (yearFilter.value === 'last' && !isLastYear(s.matric_number)) return false
    return true
  })
)
const departments = computed(() =>
  [...new Set(yearStudents.value.map((s) => dept(s.matric_number)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
)
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return yearStudents.value.filter((s) => {
    if (departmentFilter.value !== 'all' && dept(s.matric_number) !== departmentFilter.value) {
      return false
    }
    if (paymentFilter.value === 'paid' && !s.has_paid) return false
    if (paymentFilter.value === 'unpaid' && s.has_paid) return false
    if (!q) return true
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.matric_number.toLowerCase().includes(q)
    )
  })
})

watch(yearFilter, () => {
  departmentFilter.value = 'all'
})

async function load() {
  try {
    const [s, g] = await Promise.all([listStudents(), listGroups()])
    students.value = (s || [])
      .slice()
      .sort((a, b) => compareMatricNumbers(a.matric_number, b.matric_number))
    groups.value = g || []
  } catch (err) {
    toast.error(err.message || 'Could not load students.')
  } finally {
    loading.value = false
  }
}

/** Matric numbers come in two shapes:
 *    ND  — FH-NCC-25-0001  (letters, then hyphenated parts)
 *    HND — HND24-01-04-0001 (letters + a 2-digit year, then hyphenated parts)
 */
const MATRIC_RE = /^[A-Za-z]{2,6}[0-9]{0,2}(-[A-Za-z0-9]{1,6}){2,3}$/
const isMatric = (token) => MATRIC_RE.test(String(token || '').trim())

/**
 * Accepts three paste shapes; blank lines and section headers are ignored:
 *   "Full Name, Matric"    (comma or tab)
 *   "Full Name MATRIC"     (matric as the last token on the line)
 *   Name and matric on separate lines, in either order
 */
function parseList(text) {
  const rows = []
  let pendingName = ''
  let pendingMatric = ''

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) {
      pendingName = ''
      pendingMatric = ''
      continue
    }

    if (trimmed.includes(',') || trimmed.includes('\t')) {
      const parts = trimmed.split(/[,\t]+/).map((p) => p.trim()).filter(Boolean)
      const matric = parts.find(isMatric) || parts[1] || ''
      const name = parts.filter((p) => p !== matric).join(' ')
      if (name && matric) rows.push({ full_name: name, matric_number: matric })
      pendingName = ''
      pendingMatric = ''
      continue
    }

    const tokens = trimmed.split(/\s+/)
    const last = tokens[tokens.length - 1]

    // Matric on its own line → pairs with the name above it, or waits for the
    // name on the next line (both paste orders are common).
    if (tokens.length === 1 && isMatric(last)) {
      if (pendingName) {
        rows.push({ full_name: pendingName, matric_number: last })
        pendingName = ''
      } else {
        pendingMatric = last
      }
      continue
    }

    // "Full Name MATRIC" on one line.
    if (tokens.length >= 2 && isMatric(last)) {
      rows.push({ full_name: tokens.slice(0, -1).join(' '), matric_number: last })
      pendingName = ''
      pendingMatric = ''
      continue
    }

    // A name line: pair it with a matric waiting above it, otherwise hold it for
    // the matric that follows.
    if (pendingMatric) {
      rows.push({ full_name: trimmed, matric_number: pendingMatric })
      pendingMatric = ''
    } else {
      pendingName = trimmed
    }
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

/** Pulls every matric-shaped token out of pasted text (handles messy names/typos).
 *  Handles both ND (FH-SWD-25-0001) and HND (HND24-01-04-0001) shapes. */
function extractMatrics(text) {
  return [...String(text).toUpperCase().matchAll(/[A-Z]{2,6}[0-9]{0,2}[- ][A-Z0-9]{1,6}[- ][0-9]{1,6}[- ][0-9]{1,6}/g)]
    .map((m) => m[0].replace(/\s+/g, '-'))
}

async function markPaid() {
  const matrics = extractMatrics(paidRaw.value)
  if (!matrics.length) {
    toast.error('No matric numbers found in that text.')
    return
  }
  markingPaid.value = true
  try {
    const updated = await markPaidByMatric(matrics, paidMethod.value)
    await load()
    paidRaw.value = ''
    toast.success(`Marked ${updated.length || matrics.length} student${(updated.length || matrics.length) === 1 ? '' : 's'} as paid.`)
  } catch (err) {
    toast.error(err.message || 'Could not mark payments.')
  } finally {
    markingPaid.value = false
  }
}

async function togglePaid(student) {
  const next = !student.has_paid
  try {
    await updateStudent(student.id, { has_paid: next, payment_method: next ? 'manual' : null })
    student.has_paid = next
    student.payment_method = next ? 'manual' : null
    toast.info(`${student.full_name.split(' ')[0]} ${next ? 'marked paid' : 'unpaid'}.`)
  } catch (err) {
    toast.error(err.message || 'Could not update payment.')
  }
}

async function toggleCertificate(student) {
  const next = !student.certificate_approved
  try {
    await updateStudent(student.id, { certificate_approved: next })
    student.certificate_approved = next
    toast.info(`Certificate ${next ? 'approved' : 'revoked'} for ${student.full_name.split(' ')[0]}.`)
  } catch (err) {
    toast.error(err.message || 'Could not update certificate.')
  }
}

/** Manual override for students who paid the download fee outside Paystack. */
async function toggleCertPaid(student) {
  const next = !student.certificate_paid
  try {
    await updateStudent(student.id, { certificate_paid: next })
    student.certificate_paid = next
    toast.info(
      `Certificate fee ${next ? 'marked paid' : 'marked unpaid'} for ${student.full_name.split(' ')[0]}.`
    )
  } catch (err) {
    toast.error(err.message || 'Could not update certificate payment.')
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
          One student per line as <strong>Full Name, Matric Number</strong> — or put the name and its
          matric on separate lines. Blank lines and section headers are ignored, and the department
          is read from the matric number.
        </p>
        <textarea
          v-model="raw"
          class="textarea"
          placeholder="Chidi Okafor, FH-SWD-25-0001&#10;Amina Bello, FH-SWD-25-0002&#10;&#10;NETWORKING AND CLOUD COMPUTING&#10;OGUNBANWO MUTIAT MODUPEOLUWA&#10;FH-NCC-25-0001"
        />
        <div class="add-actions">
          <BaseButton :loading="adding" @click="addAll">Add to class list</BaseButton>
          <span class="faint">{{ parseList(raw).length }} detected</span>
        </div>
      </section>

      <section class="card pay">
        <h3>Mark payments</h3>
        <p class="muted">
          Paste the list of matric numbers that paid. It picks out every matric-shaped code, so
          names and typos around it are ignored.
        </p>
        <div class="pay-method">
          <label>
            <input type="radio" v-model="paidMethod" value="company" />
            <span>Company account</span>
          </label>
          <label>
            <input type="radio" v-model="paidMethod" value="wunmi" />
            <span>Paid to Wunmi</span>
          </label>
        </div>
        <textarea
          v-model="paidRaw"
          class="textarea"
          placeholder="FH-SWD-25-0026&#10;FH-SWD-25-0040&#10;or paste the whole message…"
        />
        <div class="add-actions">
          <BaseButton variant="secondary" :loading="markingPaid" @click="markPaid">
            Mark as paid ({{ extractMatrics(paidRaw).length }})
          </BaseButton>
        </div>
      </section>

      <section class="card roster">
        <div class="roster-head">
          <div>
            <h3>Class list</h3>
            <p class="muted">{{ students.length }} student{{ students.length === 1 ? '' : 's' }} · {{ students.filter((s) => s.has_paid).length }} paid · {{ students.filter((s) => s.certificate_approved).length }} certificates</p>
          </div>
          <div class="roster-tools">
            <div class="year-tabs" role="tablist">
              <button
                type="button"
                class="year-tab"
                :class="{ active: yearFilter === 'all' }"
                @click="yearFilter = 'all'"
              >
                All ({{ students.length }})
              </button>
              <button
                type="button"
                class="year-tab"
                :class="{ active: yearFilter === 'current' }"
                @click="yearFilter = 'current'"
              >
                This year ({{ students.filter((s) => !isLastYear(s.matric_number)).length }})
              </button>
              <button
                type="button"
                class="year-tab"
                :class="{ active: yearFilter === 'last' }"
                @click="yearFilter = 'last'"
              >
                Last year ({{ students.filter((s) => isLastYear(s.matric_number)).length }})
              </button>
            </div>
            <select v-model="departmentFilter" class="input filter-select" aria-label="Filter by department">
              <option value="all">All departments</option>
              <option v-for="department in departments" :key="department" :value="department">
                {{ department }}
              </option>
            </select>
            <select v-model="paymentFilter" class="input filter-select" aria-label="Filter by payment status">
              <option value="all">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
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
        <p v-else-if="!filtered.length" class="muted pad">
          No students match the selected year, department, payment status, and search.
        </p>

        <ul v-else class="roster-list">
          <li v-for="(student, index) in filtered" :key="student.id">
            <span class="idx">{{ index + 1 }}</span>
            <span class="who">
              <span class="name">{{ student.full_name }}</span>
              <span class="faint matric">
                {{ student.matric_number }}<template v-if="dept(student.matric_number)"> · {{ dept(student.matric_number) }}</template>
              </span>
            </span>
            <span class="badges">
              <span class="badge" :class="student.group_id ? 'brand' : 'faint-badge'">
                {{ student.group_id ? groupName(student.group_id) : 'Unassigned' }}
              </span>
              <button
                type="button"
                class="badge toggle"
                :class="student.has_paid ? 'success' : 'warn'"
                :title="student.has_paid ? `Paid (${student.payment_method || 'manual'}) — click to undo` : 'Unpaid — click to mark paid'"
                @click="togglePaid(student)"
              >
                {{ student.has_paid ? 'Paid' : 'Unpaid' }}
              </button>
              <button
                type="button"
                class="badge toggle"
                :class="student.certificate_paid ? 'success' : 'faint-badge'"
                :title="student.certificate_paid ? 'Certificate fee paid — click to mark unpaid' : 'Certificate fee unpaid — click to mark paid (manual/offline payment)'"
                @click="toggleCertPaid(student)"
              >
                {{ student.certificate_paid ? 'Cert fee ✓' : 'Cert fee' }}
              </button>
              <button
                type="button"
                class="badge toggle"
                :class="student.certificate_approved ? 'success' : 'faint-badge'"
                :title="student.certificate_approved ? 'Certificate approved — click to revoke' : 'Approve certificate (for last-year / no-project students)'"
                @click="toggleCertificate(student)"
              >
                {{ student.certificate_approved ? 'Cert ✓' : 'Cert' }}
              </button>
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

.pay {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pay h3 {
  font-size: 18px;
}
.pay p {
  margin: 0;
  font-size: 14px;
}
.pay-method {
  display: flex;
  gap: 18px;
}
.pay-method label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  cursor: pointer;
}

.badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.badge.toggle {
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
}
.badge.faint-badge {
  background: var(--surface-2);
  color: var(--faint);
}
.badge.warn {
  background: var(--warning-soft, #fff4e0);
  color: var(--warning, #b26a00);
}
.badge.success {
  background: var(--success-soft, #e3f7e8);
  color: var(--success, #1a7f37);
}

.roster {
  grid-column: 1 / -1;
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
  flex-wrap: wrap;
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
  padding: 6px 12px;
  font-size: 12.5px;
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
.search {
  width: 210px;
}
.filter-select {
  width: auto;
  min-width: 170px;
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
  .year-tabs {
    width: 100%;
  }
  .year-tab {
    flex: 1;
    padding-inline: 8px;
  }
  .filter-select {
    flex: 1;
    min-width: 135px;
  }
}
</style>
