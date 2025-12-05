<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ValidationResult, ValidationMessage, UTMParamKey } from '../lib/types';
import UtmTable from './UtmTable.vue';
import { buildCleanUrl } from '../lib/fixer';

const props = defineProps<{
  result: ValidationResult;
  originalUrl: string;
}>();

const emit = defineEmits<{
  fix: [suggestion: string];
  fixAll: [suggestions: string[]];
  updateParam: [key: UTMParamKey, value: string];
}>();

// Copy state
const copied = ref(false);

// Compute clean URL
const cleanUrl = computed(() => {
  if (!props.originalUrl) return '';
  return buildCleanUrl(props.originalUrl, props.result.parsedParams);
});

// Copy URL to clipboard
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

function handleUpdateParam(key: UTMParamKey, value: string) {
  emit('updateParam', key, value);
}

function getStatusInfo(result: ValidationResult) {
  if (result.isValid && !result.hasWarnings) {
    return {
      icon: '✅',
      text: 'Ready to use',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      textClass: 'text-emerald-400',
      statusType: 'success' as const,
    };
  }
  if (result.isValid && result.hasWarnings) {
    return {
      icon: '⚠️',
      text: 'Ready (with suggestions)',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      textClass: 'text-amber-400',
      statusType: 'warning' as const,
    };
  }
  return {
    icon: '❌',
    text: 'Needs fixes',
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-400',
    statusType: 'error' as const,
  };
}

function handleFixClick(suggestion: string) {
  emit('fix', suggestion);
}

function handleFixAll() {
  // Only fix errors, not warnings
  const errorSuggestions = props.result.errors
    .filter((m): m is ValidationMessage & { suggestion: string } => !!m.suggestion)
    .map((m) => m.suggestion);
  if (errorSuggestions.length > 0) {
    emit('fixAll', errorSuggestions);
  }
}

// Check if there are any fixable errors
function hasFixableErrors(errors: ValidationMessage[]) {
  return errors.some((m) => m.suggestion);
}
</script>

<template>
  <div class="space-y-4 animate-fade-in overflow-hidden">
    <!-- Combined Status + URL Banner -->
    <div
      :class="[
        'rounded-lg border overflow-hidden min-h-[120px] flex flex-col',
        getStatusInfo(result).bgClass,
      ]"
    >
      <!-- Status Header with Action Button -->
      <div class="flex items-center justify-between gap-3 px-4 py-3 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-xl">{{ getStatusInfo(result).icon }}</span>
          <span :class="['font-semibold', getStatusInfo(result).textClass]">
            {{ getStatusInfo(result).text }}
          </span>
        </div>

        <!-- Fix All Button (only for errors) -->
        <button
          v-if="hasFixableErrors(result.errors)"
          @click="handleFixAll"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-lime text-surface-900 text-sm font-semibold rounded-lg hover:bg-accent-lime/90 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Fix All
        </button>

        <!-- Copy Button (when valid or warnings only) -->
        <button
          v-else
          @click="copyUrl"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all',
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-surface-600 hover:bg-surface-500 text-zinc-200 border border-surface-500',
          ]"
        >
          <template v-if="copied">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </template>
          <template v-else>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy URL
          </template>
        </button>
      </div>

      <!-- URL Display -->
      <div 
        :class="[
          'px-4 py-3 border-t font-mono text-sm break-all mt-auto',
          getStatusInfo(result).statusType === 'error' ? 'border-red-500/20 bg-red-500/5' : 
          getStatusInfo(result).statusType === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 
          'border-emerald-500/20 bg-emerald-500/5'
        ]"
        style="word-break: break-all; overflow-wrap: anywhere;"
      >
        <span class="text-zinc-300">{{ cleanUrl }}</span>
      </div>
    </div>

    <!-- Issues Grid: Errors & Warnings side by side when both exist -->
    <div v-if="result.errors.length > 0 || result.warnings.length > 0" :class="[
      'grid gap-4',
      result.errors.length > 0 && result.warnings.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
    ]">
      <!-- Errors Section -->
      <div v-if="result.errors.length > 0" class="space-y-2">
        <h3 class="flex items-center gap-2 text-xs font-medium text-red-400 uppercase tracking-wide">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500/20 text-[10px]">
            {{ result.errors.length }}
          </span>
          Errors
        </h3>
        <ul class="space-y-1.5">
          <li
            v-for="(msg, index) in result.errors"
            :key="`error-${index}`"
            class="animate-slide-in p-3 rounded-lg bg-red-500/5 border border-red-500/20"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div class="flex items-start gap-2">
              <span class="text-xs mt-0.5">🔴</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-red-300 leading-relaxed">
                  {{ msg.message }}
                </p>
                <div v-if="msg.suggestion" class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <button
                    @click="handleFixClick(msg.suggestion)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-lime/10 hover:bg-accent-lime/20 border border-accent-lime/30 rounded text-accent-lime text-[11px] font-mono transition-colors cursor-pointer group"
                  >
                    <span>{{ msg.suggestion.split(' or ')[0] }}</span>
                    <svg
                      class="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Warnings Section -->
      <div v-if="result.warnings.length > 0" class="space-y-2">
        <h3
          class="flex items-center gap-2 text-xs font-medium text-amber-400 uppercase tracking-wide"
        >
          <span
            class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-[10px]"
          >
            {{ result.warnings.length }}
          </span>
          Warnings
        </h3>
        <ul class="space-y-1.5">
          <li
            v-for="(msg, index) in result.warnings"
            :key="`warning-${index}`"
            class="animate-slide-in p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
            :style="{ animationDelay: `${(result.errors.length + index) * 50}ms` }"
          >
            <div class="flex items-start gap-2">
              <span class="text-xs mt-0.5">🟡</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-amber-300 leading-relaxed">
                  {{ msg.message }}
                </p>
                <div v-if="msg.suggestion" class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <button
                    @click="handleFixClick(msg.suggestion)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-[11px] font-mono transition-colors cursor-pointer group"
                  >
                    <span>{{ msg.suggestion.split(' or ')[0] }}</span>
                    <svg
                      class="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Parsed Parameters Table -->
    <div class="space-y-2 min-w-0 overflow-hidden">
      <h3 class="text-xs font-medium text-zinc-400 uppercase tracking-wide">
        UTM Parameters
      </h3>
      <UtmTable 
        :params="result.parsedParams" 
        :channel-id="result.channelId" 
        @update-param="handleUpdateParam"
      />
    </div>
  </div>
</template>
