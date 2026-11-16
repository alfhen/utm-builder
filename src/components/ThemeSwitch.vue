<script setup lang="ts">
import { ref, watchEffect } from 'vue';

type Theme = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'utm-builder:theme';

function stored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

const theme = ref<Theme>(stored());

watchEffect(() => {
  const root = document.documentElement;
  if (theme.value === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = theme.value;
  try {
    localStorage.setItem(STORAGE_KEY, theme.value);
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
});

const options: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Match system theme' },
  { value: 'light', label: 'Light theme' },
  { value: 'dark', label: 'Dark theme' },
];
</script>

<template>
  <div role="radiogroup" aria-label="Colour theme" class="inline-flex rounded-lg border border-line bg-panel p-0.5">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="theme === option.value"
      :aria-label="option.label"
      :title="option.label"
      class="grid size-7 place-items-center rounded-md transition-colors"
      :class="theme === option.value ? 'bg-ink text-panel' : 'text-ink-3 hover:text-ink'"
      @click="theme = option.value"
    >
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <template v-if="option.value === 'system'">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
        </template>
        <template v-else-if="option.value === 'light'">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </template>
        <path v-else d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
      </svg>
    </button>
  </div>
</template>
