<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { UTMParamKey, ValidationResult } from '../lib/types';
import { UTM_PARAM_KEYS } from '../lib/types';
import { PARAM_META } from '../lib/channels';

const props = defineProps<{
  url: string;
  result: ValidationResult | null;
  hasParseError: boolean;
  active: UTMParamKey | null;
}>();

const emit = defineEmits<{
  fixAll: [];
  copied: [url: string];
  active: [key: UTMParamKey | null];
}>();

interface Segment {
  text: string;
  key?: UTMParamKey;
}

const segments = computed<Segment[]>(() => {
  if (!props.url) return [];
  try {
    const parsed = new URL(props.url);
    const hash = parsed.hash;
    const withoutHash = hash ? props.url.slice(0, -hash.length) : props.url;
    const [base, query] = [withoutHash.split('?')[0]!, withoutHash.split('?').slice(1).join('?')];
    const out: Segment[] = [{ text: base }];
    query
      .split('&')
      .filter(Boolean)
      .forEach((pair, i) => {
        const name = decodeURIComponent(pair.split('=')[0] ?? '');
        const key = (UTM_PARAM_KEYS as readonly string[]).includes(name) ? (name as UTMParamKey) : undefined;
        out.push({ text: i === 0 ? '?' : '&' }, { text: pair, key });
      });
    if (hash) out.push({ text: hash });
    return out;
  } catch {
    return [{ text: props.url }];
  }
});

const fixableCount = computed(() => props.result?.errors.filter((e) => e.suggestion).length ?? 0);

const status = computed(() => {
  const r = props.result;
  if (props.hasParseError) return { tone: 'err', text: 'Fix the destination URL first' };
  if (!r) return { tone: 'idle', text: 'Your tagged link will appear here' };
  if (r.errors.length) {
    const n = r.errors.length;
    return { tone: 'err', text: `${n} ${n === 1 ? 'issue' : 'issues'} to fix before copying` };
  }
  if (r.warnings.length) {
    const n = r.warnings.length;
    return { tone: 'warn', text: `Ready to use, with ${n} ${n === 1 ? 'suggestion' : 'suggestions'}` };
  }
  return { tone: 'ok', text: 'Ready to use' };
});

const canCopy = computed(() => !!props.url && !!props.result && props.result.errors.length === 0);
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  if (!canCopy.value) return;
  try {
    await navigator.clipboard.writeText(props.url);
    copyState.value = 'copied';
    emit('copied', props.url);
  } catch {
    copyState.value = 'failed';
  }
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => (copyState.value = 'idle'), 2000);
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    copy();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div
    class="sticky bottom-0 z-10 -mx-4 bg-gradient-to-t from-bg from-70% to-transparent px-4 pt-6 pb-4 sm:-mx-6 sm:px-6 lg:top-0 lg:bottom-auto lg:mx-0 lg:bg-gradient-to-b lg:px-0 lg:pt-6 lg:pb-6"
  >
    <div class="rounded-xl border border-line bg-panel shadow-[0_8px_30px_-12px_rgb(0_0_0/0.25)]">
      <p
        class="max-h-36 overflow-y-auto px-4 pt-4 pb-3 font-mono text-[13px] leading-relaxed break-all sm:px-5 lg:max-h-48 lg:min-h-[5.5rem] lg:px-6 lg:pt-5 lg:pb-4 lg:text-[15px]"
        :class="url ? 'text-ink-3' : 'text-ink-3/70 italic font-sans text-sm'"
      >
        <template v-if="url">
          <span
            v-for="(seg, i) in segments"
            :key="i"
            :class="seg.key ? 'rounded-sm px-px transition-colors cursor-default' : ''"
            :style="
              seg.key
                ? {
                    color: PARAM_META[seg.key].color,
                    backgroundColor: active === seg.key ? `color-mix(in srgb, ${PARAM_META[seg.key].color} 16%, transparent)` : undefined,
                  }
                : undefined
            "
            @mouseenter="seg.key && emit('active', seg.key)"
            @mouseleave="seg.key && emit('active', null)"
          >{{ seg.text }}</span>
        </template>
        <template v-else>https://…</template>
      </p>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5 lg:px-6">
        <p class="flex items-center gap-2 text-sm font-medium" aria-live="polite">
          <span
            class="size-2 rounded-full"
            :class="{
              'bg-ok': status.tone === 'ok',
              'bg-warn': status.tone === 'warn',
              'bg-err': status.tone === 'err',
              'bg-ink-3/50': status.tone === 'idle',
            }"
          />
          <span :class="status.tone === 'idle' ? 'text-ink-3' : 'text-ink'">{{ status.text }}</span>
        </p>

        <div class="flex items-center gap-2">
          <a
            v-if="url && result"
            :href="url"
            target="_blank"
            rel="noopener"
            class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-field hover:text-ink sm:inline-block"
          >
            Open link
          </a>
          <button
            v-if="fixableCount"
            type="button"
            class="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-field"
            @click="emit('fixAll')"
          >
            Fix {{ fixableCount === 1 ? 'it' : `all ${fixableCount}` }}
          </button>
          <button
            type="button"
            :disabled="!canCopy"
            class="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-sm font-semibold text-panel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            @click="copy"
          >
            <svg v-if="copyState === 'copied'" class="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m3 8.5 3 3 7-7" />
            </svg>
            {{ copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed, select the link' : 'Copy link' }}
            <kbd class="ml-1 hidden font-sans text-xs font-normal opacity-60 lg:inline">{{ isMac ? '⌘' : 'Ctrl' }}↵</kbd>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
