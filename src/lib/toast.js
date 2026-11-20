import { reactive } from 'vue'

let seq = 0

export const toasts = reactive([])

function push(type, message, timeout = 4200) {
  const id = ++seq
  toasts.push({ id, type, message })
  if (timeout) setTimeout(() => dismiss(id), timeout)
  return id
}

export function dismiss(id) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

export const toast = {
  success: (message) => push('success', message),
  error: (message) => push('error', message, 6000),
  info: (message) => push('info', message)
}
