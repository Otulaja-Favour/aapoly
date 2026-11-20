<script setup>
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfigNotice from '@/components/ConfigNotice.vue'
import { listProjects, seedProjects } from '@/lib/api'
import { PROJECTS } from '@/data/projects'
import { toast } from '@/lib/toast'

const dbProjects = ref([])
const loading = ref(true)
const seeding = ref(false)

const inDb = (slug) => dbProjects.value.some((p) => p.slug === slug)

async function load() {
  try {
    dbProjects.value = (await listProjects()) || []
  } catch {
    dbProjects.value = []
  } finally {
    loading.value = false
  }
}

async function seed() {
  seeding.value = true
  try {
    await seedProjects(PROJECTS)
    await load()
    toast.success('Project catalogue saved to AfriBase.')
  } catch (err) {
    toast.error(err.message || 'Could not seed the catalogue.')
  } finally {
    seeding.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="stack page">
    <ConfigNotice />

    <div class="head">
      <div>
        <h2>Catalogue</h2>
        <p class="muted">Projects students can be assigned. Starter code lives in the repo's <code>projects/</code> folder.</p>
      </div>
      <BaseButton :loading="seeding" @click="seed">Save catalogue to AfriBase</BaseButton>
    </div>

    <div class="list">
      <article v-for="project in PROJECTS" :key="project.slug" class="card item">
        <div class="item-top">
          <h3>{{ project.name }}</h3>
          <span class="badge" :class="inDb(project.slug) ? 'success' : ''">
            {{ inDb(project.slug) ? 'In database' : 'Not saved' }}
          </span>
        </div>
        <p class="muted">{{ project.description }}</p>
        <div class="meta">
          <span v-if="project.difficulty" class="badge">{{ project.difficulty }}</span>
          <span v-for="tag in project.tags" :key="tag" class="badge">{{ tag }}</span>
        </div>
        <p class="repo"><code>{{ project.repo_folder }}</code></p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.page {
  gap: 20px;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.head h2 {
  font-size: 22px;
}
.head p {
  margin: 4px 0 0;
  font-size: 14px;
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.item {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.item h3 {
  font-size: 17px;
}
.item p {
  margin: 0;
  font-size: 14px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.repo code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface-2);
  font-size: 12.5px;
  color: var(--muted);
}

code {
  padding: 1px 5px;
  border-radius: 6px;
  background: var(--surface-2);
  font-size: 12.5px;
}
</style>
