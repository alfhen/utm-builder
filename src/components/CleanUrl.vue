<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ParsedUTMParams } from '../lib/types';
import { buildCleanUrl } from '../lib/fixer';

const props = withDefaults(defineProps<{
  originalUrl: string;
  params: ParsedUTMParams;
  status: 'success' | 'warning' | 'error';
  compact?: boolean;
}>(), {
  compact: false,
});

const copied = ref(false);

const cleanUrl = computed(() => {
  if (!props.originalUrl) return '';
  return buildCleanUrl(props.originalUrl, props.params);
});

const statusStyles = computed(() => {
  switch (props.status) {
    case 'success':
      return {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/5',
        highlight: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        icon: '✅',
      };
    case 'warning':
      return {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        highlight: 'bg-amber-500/10',
        text: 'text-amber-400',
        icon: '⚠️',
      };
    case 'error':
      return {
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
        highlight: 'bg-red-500/10',
        text: 'text-red-400',
        icon: '❌',
      };
  }
});

async function copyUrl() {
  if (!cleanUrl.value) return;
  
  try {
    await navigator.clipboard.writeText(cleanUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}
</script>

<template>
  <div 
    v-if="cleanUrl" 
    :class="[
      'rounded-lg border overflow-hidden h-full flex flex-col',
      statusStyles.border,
      statusStyles.bg,
    ]"
  >
    <!-- URL Display -->
    <div :class="compact ? 'p-3 flex-1' : 'p-4'">
      <div class="flex items-start gap-2">
        <span :class="['shrink-0', compact ? 'text-sm' : 'mt-0.5']">{{ statusStyles.icon }}</span>
        <div class="flex-1 min-w-0">
          <p
            :class="[
              'font-mono break-all text-zinc-200 leading-relaxed overflow-hidden',
              compact ? 'text-xs' : 'text-sm',
            ]"
            style="word-break: break-all; overflow-wrap: anywhere;"
          >
            {{ cleanUrl }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Copy Button Bar -->
    <div
      :class="[
        'flex items-center justify-between border-t mt-auto',
        compact ? 'px-3 py-2' : 'px-4 py-2.5',
        statusStyles.highlight,
        statusStyles.border,
      ]"
    >
      <span :class="['font-medium', statusStyles.text, compact ? 'text-[10px]' : 'text-xs']">
        {{ status === 'success' ? 'Ready to use' : status === 'warning' ? 'Usable' : 'Fix errors first' }}
      </span>
      
      <button
        @click="copyUrl"
        :disabled="status === 'error'"
        :class="[
          'inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-200',
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
          status === 'error'
            ? 'bg-surface-600 text-zinc-500 cursor-not-allowed'
            : copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-surface-600 hover:bg-surface-500 text-zinc-200 border border-surface-500',
        ]"
      >
        <template v-if="copied">
          <svg :class="compact ? 'w-3 h-3' : 'w-4 h-4'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span v-if="!compact">Copied!</span>
        </template>
        <template v-else>
          <svg :class="compact ? 'w-3 h-3' : 'w-4 h-4'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </template>
      </button>
    </div>
  </div>
</template>

