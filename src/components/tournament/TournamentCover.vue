<template>
  <!-- Court photo with a dark gradient for text on top; older tournaments without a photo get a court-colored fallback -->
  <div class="relative overflow-hidden bg-gradient-to-br from-primary-container/40 via-surface-container-high to-surface-container">
    <img v-if="src" :src="src" :alt="alt" loading="lazy" class="h-full w-full object-cover" />
    <span v-else class="icon icon-fill absolute right-4 top-1/2 -translate-y-1/2 text-[96px] text-primary-container/30">sports_basketball</span>
    <div class="absolute inset-0 bg-gradient-to-t from-[rgba(11,15,23,0.95)] via-[rgba(11,15,23,0.35)] to-transparent" />
    <div class="absolute inset-0 flex flex-col justify-end p-space-md">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' }
})
</script>
