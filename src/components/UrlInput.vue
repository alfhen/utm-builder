<script setup lang="ts">
const modelValue = defineModel<string>({ required: true });
const emit = defineEmits<{
  paste: []
  input: []
}>();

function handlePaste() {
  // Emit after a tiny delay to ensure v-model has updated
  setTimeout(() => emit('paste'), 0);
}

function handleInput() {
  emit('input');
}
</script>

<template>
  <div class="space-y-2">
    <label for="url-input" class="block text-sm font-medium text-zinc-300">
      Your URL
    </label>
    <textarea
      id="url-input"
      v-model="modelValue"
      @paste="handlePaste"
      @input="handleInput"
      rows="3"
      placeholder="Paste your URL here..."
      class="w-full px-4 py-3 bg-surface-800 border border-surface-600 rounded-lg text-zinc-100 font-mono text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-all resize-y min-h-[80px]"
    />
  </div>
</template>
