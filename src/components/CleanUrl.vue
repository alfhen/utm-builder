<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ParsedUTMParams } from '../lib/types';
import { buildCleanUrl } from '../lib/fixer';

const props = defineProps<{
  originalUrl: string;
  params: ParsedUTMParams;
  status: 'success' | 'warning' | 'error';
}>();

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
  <div v-if="cleanUrl" class="space-y-3">
    <h3 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">
      Clean URL
    </h3>
    <div
      :class="[
        'rounded-lg border overflow-hidden',
        statusStyles.border,
        statusStyles.bg,
      ]"
    >
      <!-- URL Display -->
      <div class="p-4">
        <div class="flex items-start gap-3">
          <span class="shrink-0 mt-0.5">{{ statusStyles.icon }}</span>
          <div class="flex-1 min-w-0">
            <p
              class="font-mono text-sm break-all text-zinc-200 leading-relaxed"
            >
              {{ cleanUrl }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Copy Button Bar -->
      <div
        :class="[
          'flex items-center justify-between px-4 py-2.5 border-t',
          statusStyles.highlight,
          statusStyles.border,
        ]"
      >
        <span :class="['text-xs font-medium', statusStyles.text]">
          {{ status === 'success' ? 'Ready to use' : status === 'warning' ? 'Usable with warnings' : 'Fix errors first' }}
        </span>
        
        <button
          @click="copyUrl"
          :disabled="status === 'error'"
          :class="[
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
            status === 'error'
              ? 'bg-surface-600 text-zinc-500 cursor-not-allowed'
              : copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-surface-600 hover:bg-surface-500 text-zinc-200 border border-surface-500',
          ]"
        >
          <template v-if="copied">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </template>
          <template v-else>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy URL
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

