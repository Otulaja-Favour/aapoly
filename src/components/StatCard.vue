<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  accent: { type: String, default: 'brand' } // brand | success | muted
})
</script>

<template>
  <div class="stat card">
    <span class="stat-label">{{ label }}</span>
    <span class="stat-value" :class="accent">{{ value }}</span>
    <span v-if="hint" class="stat-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.stat {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--faint);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}

.stat-value.brand {
  color: var(--brand);
}
.stat-value.success {
  color: var(--success);
}
.stat-value.muted {
  color: var(--muted);
}

.stat-hint {
  font-size: 13px;
  color: var(--muted);
}
</style>
