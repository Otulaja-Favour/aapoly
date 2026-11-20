<script setup>
import { dismiss, toasts } from '@/lib/toast'
</script>

<template>
  <div class="toast-host">
    <TransitionGroup name="toast">
      <button
        v-for="item in toasts"
        :key="item.id"
        type="button"
        class="toast"
        :class="item.type"
        @click="dismiss(item.id)"
      >
        <span class="toast-dot" />
        <span class="toast-msg">{{ item.message }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  z-index: 90;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(360px, calc(100vw - 32px));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
}

.toast-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--faint);
  flex: none;
}

.toast.success {
  border-left-color: var(--success);
}
.toast.success .toast-dot {
  background: var(--success);
}

.toast.error {
  border-left-color: var(--danger);
}
.toast.error .toast-dot {
  background: var(--danger);
}

.toast.info {
  border-left-color: var(--brand);
}
.toast.info .toast-dot {
  background: var(--brand);
}

.toast-msg {
  flex: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 480px) {
  .toast-host {
    left: 16px;
    right: 16px;
    bottom: 16px;
    max-width: none;
  }
}
</style>
