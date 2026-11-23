<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { findStudentByMatric, listGroups, listSettings } from '@/lib/api'
import aapolyLogo from '@/assets/aapolys.webp'
import itcLogo from '@/assets/ijebu.png'

const route = useRoute()
const matric = String(route.params.matric || '').toUpperCase()

const student = ref(null)
const group = ref(null)
const settings = ref({})
const loading = ref(true)
const error = ref('')

// A student can download their certificate when:
//  - the admin manually approved it (last-year / no-project students), or
//  - their group's project was marked complete.
const certificateReady = computed(
  () => Boolean(student.value?.certificate_approved || group.value?.project_approved)
)

const programName = computed(
  () =>
    settings.value.certificate_program ||
    'Mandatory Skills Qualification (MSQ) Programme at Abraham Adesanya Polytechnic (AAPOLY), in partnership with the Ijebu Tech Community (ITC)'
)
const certificateDate = computed(() => settings.value.certificate_date || '17th December 2025')

onMounted(async () => {
  try {
    const [found, groups, s] = await Promise.all([
      findStudentByMatric(matric),
      listGroups(),
      listSettings()
    ])
    student.value = found
    settings.value = s || {}
    group.value = (groups || []).find((g) => g.id === found?.group_id) || null
    if (!found) error.value = 'Student not found.'
  } catch (err) {
    error.value = err.message || 'Could not load certificate.'
  } finally {
    loading.value = false
  }
})

function download() {
  window.print()
}
</script>

<template>
  <div class="cert-page">
    <div v-if="loading" class="state">Loading certificate…</div>

    <div v-else-if="error" class="state">
      <p>{{ error }}</p>
      <RouterLink to="/student" class="back-link">← Back to student portal</RouterLink>
    </div>

    <div v-else-if="!certificateReady" class="state">
      <p>
        Your certificate isn't ready yet.
        {{
          group
            ? 'Wait for your team project to be marked complete by your lecturer.'
            : 'Contact your lecturer to have your certificate approved.'
        }}
      </p>
      <RouterLink to="/student" class="back-link">← Back to student portal</RouterLink>
    </div>

    <template v-else>
      <div class="toolbar no-print">
        <RouterLink to="/student" class="back-link">← Student portal</RouterLink>
        <button type="button" class="print-btn" @click="download">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
          </svg>
          Download as PDF
        </button>
      </div>

      <div class="sheet">
        <div class="left-art" aria-hidden="true">
          <div class="facet top" />
          <div class="facet pale" />
          <div class="facet lower" />
          <div class="facet center" />
          <div class="facet bottom" />
        </div>
        <div class="gold-seal">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="url(#gold)" stroke="#b8860b" stroke-width="2" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="#fff6d5" stroke-width="1.5" opacity="0.7" />
            <path d="M50 28 L55 44 L72 44 L58 54 L63 70 L50 60 L37 70 L42 54 L28 44 L45 44 Z" fill="#fff6d5" />
            <defs>
              <radialGradient id="gold" cx="40%" cy="35%">
                <stop offset="0%" stop-color="#ffe08a" />
                <stop offset="60%" stop-color="#f0b429" />
                <stop offset="100%" stop-color="#b8860b" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <!-- Logos -->
        <div class="logos">
          <img :src="itcLogo" alt="ITC" class="logo" />
          <img :src="aapolyLogo" alt="AAPOLY" class="logo" />
        </div>

        <h1 class="title">CERTIFICATE</h1>
        <p class="subtitle">OF COMPLETION</p>

        <p class="certify">This is to certify that:</p>

        <p class="name">{{ student.full_name }}</p>
        <div class="name-line" />
        <p class="matric">{{ student.matric_number }}</p>

        <p class="body">
          Has successfully completed the {{ programName }}, demonstrating
          commitment and satisfactory performance.
        </p>

        <p class="date">{{ certificateDate }}</p>

        <!-- Signatures + wax seal -->
        <div class="signatures">
          <div class="sig">
            <img v-if="settings.signature_aapoly" :src="settings.signature_aapoly" class="sig-img" alt="AAPOLY signature" />
            <div class="sig-line" />
            <span class="sig-label">AAPOLY Management</span>
          </div>

          <div class="wax-seal" aria-hidden="true">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="#9b1c1c" />
              <circle cx="40" cy="40" r="30" fill="none" stroke="#c0392b" stroke-width="1.5" opacity="0.6" />
              <path d="M40 20 L44 35 L60 35 L47 44 L52 60 L40 50 L28 60 L33 44 L20 35 L36 35 Z" fill="#7a1414" opacity="0.8" />
            </svg>
          </div>

          <div class="sig">
            <img v-if="settings.signature_itc" :src="settings.signature_itc" class="sig-img" alt="ITC signature" />
            <div class="sig-line" />
            <span class="sig-label">ITC Coordinator</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cert-page {
  min-height: 100vh;
  background: #e9ecef;
  padding: 24px;
  box-sizing: border-box;
}

.state {
  max-width: 460px;
  margin: 80px auto;
  text-align: center;
  color: var(--muted);
  font-size: 15px;
}
.back-link {
  display: inline-block;
  margin-top: 14px;
  color: var(--brand);
  text-decoration: none;
  font-weight: 600;
}

.toolbar {
  max-width: 1100px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.print-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius);
  background: var(--brand);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.sheet {
  position: relative;
  width: 1100px;
  height: 760px;
  margin: 0 auto;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
  font-family: 'Georgia', 'Times New Roman', serif;
}

/* Layered angular panels based on the certificate's left-side design. */
.left-art {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 100%;
  pointer-events: none;
}
.facet {
  position: absolute;
  inset: 0;
}
.facet.top {
  width: 275px;
  background: #0b4d20;
  clip-path: polygon(0 0, 100% 0, 0 57%);
}
.facet.pale {
  width: 390px;
  background: #f4f2ed;
  clip-path: polygon(64% 0, 100% 0, 62% 43%, 43% 57%, 32% 57%);
}
.facet.lower {
  width: 320px;
  background: #1a7131;
  clip-path: polygon(0 57%, 82% 100%, 0 100%);
}
.facet.center {
  width: 360px;
  background: #0d572b;
  clip-path: polygon(0 57%, 100% 70%, 64% 91%, 80% 100%, 59% 100%);
}
.facet.bottom {
  width: 250px;
  background: #23813b;
  clip-path: polygon(0 66%, 75% 100%, 0 100%);
}

.gold-seal {
  position: absolute;
  top: 145px;
  left: 52px;
  width: 148px;
  height: 148px;
}

.logos {
  position: absolute;
  top: 46px;
  left: 65%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 36px;
}
.logo {
  height: 64px;
  width: auto;
  object-fit: contain;
}

.title {
  position: absolute;
  top: 150px;
  left: 360px;
  right: 60px;
  text-align: center;
  font-size: 52px;
  letter-spacing: 8px;
  color: #0b4d2e;
  margin: 0;
  font-weight: 700;
}
.subtitle {
  position: absolute;
  top: 212px;
  left: 360px;
  right: 60px;
  text-align: center;
  font-size: 20px;
  letter-spacing: 6px;
  color: #0b4d2e;
  margin: 0;
}

.certify {
  position: absolute;
  top: 280px;
  left: 360px;
  right: 60px;
  text-align: center;
  font-size: 16px;
  color: #555;
  font-style: italic;
}

.name {
  position: absolute;
  top: 340px;
  left: 360px;
  right: 60px;
  text-align: center;
  font-size: 38px;
  color: #0b4d2e;
  font-weight: 700;
  margin: 0;
  font-family: 'Brush Script MT', cursive;
}
.name-line {
  position: absolute;
  top: 400px;
  left: 440px;
  right: 140px;
  height: 1px;
  background: #0b4d2e;
}
.matric {
  position: absolute;
  top: 410px;
  left: 360px;
  right: 60px;
  text-align: center;
  font-size: 14px;
  color: #777;
  letter-spacing: 1px;
}

.body {
  position: absolute;
  top: 460px;
  left: 400px;
  right: 100px;
  text-align: center;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.date {
  position: absolute;
  top: 570px;
  left: 400px;
  right: 100px;
  text-align: center;
  font-size: 15px;
  color: #0b4d2e;
  font-weight: 600;
}

.signatures {
  position: absolute;
  bottom: 60px;
  left: 380px;
  right: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.sig {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sig-img {
  height: 56px;
  width: auto;
  max-width: 200px;
  object-fit: contain;
  margin-bottom: 6px;
}
.sig-line {
  width: 100%;
  height: 1px;
  background: #333;
  margin-bottom: 6px;
}
.sig-label {
  font-size: 13px;
  font-weight: 700;
  color: #0b4d2e;
  letter-spacing: 1px;
}

.wax-seal {
  width: 80px;
  height: 80px;
  flex: none;
  margin-bottom: -10px;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }
  body {
    background: #fff;
  }
  .cert-page {
    padding: 0;
    background: #fff;
  }
  .no-print {
    display: none !important;
  }
  .sheet {
    box-shadow: none;
    width: 297mm;
    height: 210mm;
  }
}
</style>
