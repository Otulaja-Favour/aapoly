<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  variant: { type: String, default: 'danger' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

function onKeydown(event) {
  if (event.key === 'Escape' && props.open && !props.loading) emit('cancel')
}

function onBackdrop() {
  if (!props.loading) emit('cancel')
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="onBackdrop">
        <div class="dialog" role="dialog" aria-modal="true" :aria-label="title">
          <h3 class="title">{{ title }}</h3>
          <p v-if="message" class="message">{{ message }}</p>
          <div class="actions">
            <BaseButton variant="ghost" :disabled="loading" @click="emit('cancel')">
              {{ cancelLabel }}
            </BaseButton>
            <BaseButton :variant="variant" :loading="loading" @click="emit('confirm')">
              {{ confirmLabel }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(18, 20, 31, 0.45);
  backdrop-filter: blur(2px);
}

.dialog {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  font-size: 18px;
}

.message {
  margin: 0;
  font-size: 14.5px;
  color: var(--muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: translateY(8px) scale(0.98);
}
</style>
