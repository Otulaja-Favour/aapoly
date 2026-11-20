<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger
  size: { type: String, default: 'md' }, // sm | md
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
})
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[variant, size, { block, 'is-loading': loading }]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 14.5px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.05s ease;
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn.sm {
  padding: 8px 12px;
  font-size: 13.5px;
}

.btn.md {
  padding: 11px 18px;
}

.btn.block {
  width: 100%;
}

.btn.primary {
  background: var(--brand);
  color: var(--brand-contrast);
}
.btn.primary:hover:not(:disabled) {
  background: var(--brand-strong);
}

.btn.secondary {
  background: var(--surface);
  border-color: var(--border-strong);
  color: var(--text);
}
.btn.secondary:hover:not(:disabled) {
  border-color: var(--muted);
}

.btn.ghost {
  background: transparent;
  color: var(--muted);
}
.btn.ghost:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--text);
}

.btn.danger {
  background: var(--danger-soft);
  color: var(--danger);
}
.btn.danger:hover:not(:disabled) {
  background: var(--danger);
  color: #fff;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.7s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
