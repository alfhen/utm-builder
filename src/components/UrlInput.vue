<script setup lang="ts">
import { nextTick } from 'vue';

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    error: string | null;
    hero?: boolean;
  }>(),
  { hero: false },
);

const emit = defineEmits<{
  paste: [];
  input: [];
  submit: [];
  example: [];
  clear: [];
}>();

async function onPaste() {
  await nextTick();
  emit('paste');
}
</script>

<template>
  <section class="space-y-2" style="view-transition-name: url-field">
    <div v-if="!hero" class="flex items-baseline justify-between gap-4">
      <label for="url-input" class="text-[15px] font-semibold">Destination URL</label>
      <button
        v-if="model"
        type="button"
        class="text-sm text-ink-3 underline-offset-2 hover:text-ink hover:underline"
        @click="emit('clear')"
      >
        Start over
      </button>
    </div>
    <label v-else for="url-input" class="sr-only">Destination URL</label>

    <textarea
      id="url-input"
      v-model="model"
      rows="1"
      spellcheck="false"
      autocomplete="off"
      :autofocus="hero"
      placeholder="Paste a landing page URL"
      :aria-invalid="!!error"
      aria-describedby="url-help"
      class="block w-full resize-none border bg-panel font-mono leading-relaxed break-all text-ink transition-shadow [field-sizing:content] placeholder:font-sans placeholder:text-ink-3 focus:ring-4 focus:ring-[var(--p-source)]/25 focus:outline-none"
      :class="[
        hero
          ? 'min-h-16 rounded-2xl px-5 py-4 text-base shadow-[0_12px_40px_-16px_rgb(0_0_0/0.35)] placeholder:text-lg'
          : 'min-h-[3.25rem] rounded-lg px-4 py-3 text-sm placeholder:text-[15px]',
        error ? 'border-err' : hero ? 'border-ink-3/60 focus:border-[var(--p-source)]' : 'border-line focus:border-[var(--p-source)]',
      ]"
      @paste="onPaste"
      @input="emit('input')"
      @keydown.enter.prevent="emit('submit')"
    />

    <div v-if="hero" class="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p id="url-help" class="text-sm" :class="error ? 'text-err' : 'text-ink-3'" aria-live="polite">
        <template v-if="error">{{ error }}</template>
        <template v-else>
          Tagged or not.
          <button type="button" class="text-ink-2 underline underline-offset-2 hover:text-ink" @click="emit('example')">
            Try an example
          </button>
        </template>
      </p>
      <button
        type="button"
        :disabled="!model.trim()"
        class="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-panel transition-opacity hover:opacity-90 disabled:opacity-30"
        @click="emit('submit')"
      >
        Build link
      </button>
    </div>
    <p v-else id="url-help" class="text-sm" :class="error ? 'text-err' : 'text-ink-3'" aria-live="polite">
      {{ error ?? 'Existing UTM tags are read and checked, and the channel is detected for you.' }}
    </p>
  </section>
</template>
