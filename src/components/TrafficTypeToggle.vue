<script setup lang="ts">
defineProps<{
  isPaid: boolean;
}>();

const emit = defineEmits<{
  'update:isPaid': [value: boolean];
}>();
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-zinc-300">Traffic Type:</span>
    <div class="flex bg-surface-700 rounded-full p-0.5">
      <button
        type="button"
        @click="emit('update:isPaid', true)"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
        :class="[
          isPaid
            ? 'bg-accent-cyan text-surface-900'
            : 'text-zinc-400 hover:text-zinc-200'
        ]"
      >
        Paid
      </button>
      <button
        type="button"
        @click="emit('update:isPaid', false)"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
        :class="[
          !isPaid
            ? 'bg-accent-lime text-surface-900'
            : 'text-zinc-400 hover:text-zinc-200'
        ]"
      >
        Organic
      </button>
    </div>
  </div>
</template>

