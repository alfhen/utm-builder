<script setup lang="ts">
import type { RecentLink } from '../lib/recent';

defineProps<{
  links: RecentLink[];
}>();

const emit = defineEmits<{
  load: [url: string];
  clear: [];
}>();

const timeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function ago(ms: number): string {
  const minutes = Math.round((ms - Date.now()) / 60000);
  if (minutes > -60) return timeFormat.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return timeFormat.format(hours, 'hour');
  return timeFormat.format(Math.round(hours / 24), 'day');
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host + u.pathname;
  } catch {
    return url;
  }
}
</script>

<template>
  <section v-if="links.length" aria-labelledby="recent-heading" class="space-y-2">
    <div class="flex items-baseline justify-between gap-4">
      <h2 id="recent-heading" class="text-[15px] font-semibold">Recently copied</h2>
      <button type="button" class="text-sm text-ink-3 hover:text-ink hover:underline underline-offset-2" @click="emit('clear')">
        Clear history
      </button>
    </div>
    <ul class="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
      <li v-for="link in links" :key="link.url">
        <button
          type="button"
          class="block w-full px-4 py-2.5 text-left transition-colors hover:bg-field"
          :title="`Load ${link.url}`"
          @click="emit('load', link.url)"
        >
          <span class="flex items-baseline justify-between gap-3">
            <span class="truncate font-mono text-sm text-ink">{{ link.campaign || 'no campaign' }}</span>
            <span class="shrink-0 text-xs text-ink-3">{{ ago(link.copiedAt) }}</span>
          </span>
          <span class="mt-0.5 block truncate text-xs text-ink-3">{{ link.channelLabel }} · {{ shortUrl(link.url) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
