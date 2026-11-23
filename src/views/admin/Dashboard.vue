<script setup>
import { computed, onMounted, ref } from 'vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import StatCard from '@/components/StatCard.vue'
import { listGroups, listProjects, listSettings, listStudents, setSetting } from '@/lib/api'
import { PROJECTS } from '@/data/projects'
import { toast } from '@/lib/toast'

const loading = ref(true)
const students = ref([])
const groups = ref([])
const projects = ref([])
const settings = ref({})
const savingSig = ref(false)
const certDate = ref('17th December 2025')
const certProgram = ref(
  'Mandatory Skills Qualification (MSQ) Programme at Abraham Adesanya Polytechnic (AAPOLY), in partnership with the Ijebu Tech Community (ITC)'
)

const unassigned = computed(
  () => students.value.filter((s) => !s.group_id).length
)
const paidCount = computed(() => students.value.filter((s) => s.has_paid).length)
const certReady = computed(
  () =>
    students.value.filter((s) => s.certificate_approved).length +
    groups.value.filter((g) => g.project_approved).reduce((sum, g) => {
      return sum + students.value.filter((s) => s.group_id === g.id).length
    }, 0)
)
const projectName = (id) => projects.value.find((p) => p.id === id)?.name || '—'
const groupSize = (id) => students.value.filter((s) => s.group_id === id).length

onMounted(async () => {
  try {
    const [s, g, p, st] = await Promise.all([
      listStudents(),
      listGroups(),
      listProjects(),
      listSettings()
    ])
    students.value = s || []
    groups.value = g || []
    projects.value = p || []
    settings.value = st || {}
    certDate.value = st.certificate_date || certDate.value
    certProgram.value = st.certificate_program || certProgram.value
  } catch (err) {
    toast.error(err.message || 'Could not load dashboard data.')
  } finally {
    loading.value = false
  }
})

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadSignature(key, label, event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file (PNG with transparent background works best).')
    return
  }
  savingSig.value = true
  try {
    const dataUrl = await fileToDataUrl(file)
    await setSetting(key, dataUrl)
    settings.value = { ...settings.value, [key]: dataUrl }
    toast.success(`${label} signature uploaded.`)
  } catch (err) {
    toast.error(err.message || 'Could not upload signature.')
  } finally {
    savingSig.value = false
    event.target.value = ''
  }
}

async function saveCertText() {
  try {
    await Promise.all([
      setSetting('certificate_date', certDate.value),
      setSetting('certificate_program', certProgram.value)
    ])
    toast.success('Certificate text saved.')
  } catch (err) {
    toast.error(err.message || 'Could not save certificate text.')
  }
}
</script>

<template>
  <div class="stack page">
    <ConfigNotice />

    <section class="stats">
      <StatCard label="Students" :value="students.length" hint="uploaded to the class" />
      <StatCard label="Paid" :value="paidCount" accent="success" hint="students who paid" />
      <StatCard label="Groups" :value="groups.length" accent="muted" hint="generated so far" />
      <StatCard label="Certificates" :value="certReady" accent="muted" hint="ready to download" />
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
      <RouterLink class="action card" :to="{ name: 'admin-attendance' }">
        <h3>Attendance</h3>
        <p class="muted">Track weekly attendance for all 12 weeks.</p>
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
          <span class="badge" :class="group.project_approved ? 'success' : 'faint-badge'">
            {{ group.project_approved ? 'Project complete' : 'Project pending' }}
          </span>
        </li>
      </ul>
    </section>

    <section class="card cert-settings">
      <h3>Certificate settings</h3>
      <p class="muted">
        Upload signatures and set the text that appears on every certificate. Use a PNG with a
        transparent background for signatures so they merge cleanly over the line.
      </p>

      <div class="sig-grid">
        <div class="sig-box">
          <label class="sig-label">AAPOLY Management signature</label>
          <div class="sig-preview">
            <img v-if="settings.signature_aapoly" :src="settings.signature_aapoly" alt="AAPOLY signature" />
            <span v-else class="placeholder">No signature uploaded</span>
          </div>
          <input
            type="file"
            accept="image/*"
            :disabled="savingSig"
            @change="(e) => uploadSignature('signature_aapoly', 'AAPOLY', e)"
          />
        </div>

        <div class="sig-box">
          <label class="sig-label">ITC Coordinator signature</label>
          <div class="sig-preview">
            <img v-if="settings.signature_itc" :src="settings.signature_itc" alt="ITC signature" />
            <span v-else class="placeholder">No signature uploaded</span>
          </div>
          <input
            type="file"
            accept="image/*"
            :disabled="savingSig"
            @change="(e) => uploadSignature('signature_itc', 'ITC', e)"
          />
        </div>
      </div>

      <div class="text-fields">
        <label>
          <span>Certificate date</span>
          <input v-model="certDate" class="input" placeholder="17th December 2025" />
        </label>
        <label>
          <span>Programme text</span>
          <textarea v-model="certProgram" class="input" rows="3"></textarea>
        </label>
        <button class="save-btn" @click="saveCertText">Save certificate text</button>
      </div>
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
.badge.faint-badge {
  background: var(--surface-2);
  color: var(--faint);
}
.badge.success {
  background: var(--success-soft, #e3f7e8);
  color: var(--success, #1a7f37);
}

.cert-settings {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cert-settings h3 {
  font-size: 18px;
}
.cert-settings > p {
  margin: 0;
  font-size: 13.5px;
}

.sig-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}
.sig-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sig-label {
  font-weight: 600;
  font-size: 14px;
}
.sig-preview {
  min-height: 70px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  padding: 10px;
}
.sig-preview img {
  max-height: 60px;
  max-width: 100%;
  object-fit: contain;
}
.placeholder {
  color: var(--faint);
  font-size: 13px;
}

.text-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.text-fields label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
}
.save-btn {
  align-self: flex-start;
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius);
  background: var(--brand);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
</style>

