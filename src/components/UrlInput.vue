<script setup lang="ts">
import { nextTick } from 'vue';

const model = defineModel<string>({ required: true });

defineProps<{
  error: string | null;
}>();

const emit = defineEmits<{
  paste: [];
  input: [];
  example: [];
  clear: [];
}>();

async function onPaste() {
  await nextTick();
  emit('paste');
}
</script>

<template>
  <section class="space-y-2">
    <div class="flex items-baseline justify-between gap-4">
      <label for="url-input" class="text-[15px] font-semibold">Destination URL</label>
      <button
        v-if="model"
        type="button"
        class="text-sm text-ink-3 hover:text-ink underline-offset-2 hover:underline"
        @click="emit('clear')"
      >
        Clear
      </button>
      <button
        v-else
        type="button"
        class="text-sm text-ink-3 hover:text-ink underline-offset-2 hover:underline"
        @click="emit('example')"
      >
        Try an example
      </button>
    </div>
    <textarea
      id="url-input"
      v-model="model"
      rows="1"
      spellcheck="false"
      autocomplete="off"
      placeholder="Paste a landing page, with or without UTM tags"
      :aria-invalid="!!error"
      aria-describedby="url-help"
      class="block w-full resize-none rounded-lg border bg-panel px-4 py-3 font-mono text-sm leading-relaxed break-all text-ink placeholder:font-sans placeholder:text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-ink/80 [field-sizing:content] min-h-[3.25rem]"
      :class="error ? 'border-err' : 'border-line'"
      @paste="onPaste"
      @input="emit('input')"
    />
    <p id="url-help" class="text-sm" :class="error ? 'text-err' : 'text-ink-3'" aria-live="polite">
      {{ error ?? 'Existing UTM tags are read and checked, and the channel is detected for you.' }}
    </p>
  </section>
</template>
