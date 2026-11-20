<script setup>
import logo from '@/assets/aapolys.webp'

defineProps({
  height: { type: String, default: '40px' }
})
</script>

<template>
  <img :src="logo" alt="Abraham Adesanya Polytechnic" class="logo" :style="{ height }" />
</template>

<style scoped>
.logo {
  display: block;
  width: auto;
  object-fit: contain;
}
</style>
