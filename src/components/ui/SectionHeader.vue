<template>
  <div class="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
    <h2 class="m-0 flex items-center gap-space-sm font-headline-md text-headline-md uppercase text-on-surface">
      <span v-if="icon" class="icon text-primary">{{ icon }}</span>
      {{ title }}
    </h2>
    <slot />
  </div>
</template>

<script setup>
defineProps({ title: { type: String, required: true }, icon: { type: String, default: '' } })
</script>
