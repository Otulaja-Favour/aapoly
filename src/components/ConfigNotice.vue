<script setup>
import { isConfigured } from '@/lib/afribase'
</script>

<template>
  <aside v-if="!isConfigured" class="notice">
    <strong>AfriBase not connected.</strong>
    <span>
      Copy <code>.env.example</code> to <code>.env</code> and add your
      <code>VITE_AFRIBASE_URL</code> and <code>VITE_AFRIBASE_ANON_KEY</code> (Settings → API in your
      AfriBase dashboard), then run <code>db/schema.sql</code>.
    </span>
  </aside>
</template>

<style scoped>
.notice {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding: 12px 16px;
  border: 1px solid #f0d9a8;
  border-radius: var(--radius);
  background: var(--warning-soft);
  color: #7c4a03;
  font-size: 13.5px;
  line-height: 1.5;
}

code {
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 12.5px;
}
</style>
