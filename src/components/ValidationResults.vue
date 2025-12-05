<script setup lang="ts">
import type { ValidationResult, ValidationMessage, UTMParamKey } from '../lib/types';
import UtmTable from './UtmTable.vue';
import CleanUrl from './CleanUrl.vue';

const props = defineProps<{
  result: ValidationResult;
  originalUrl: string;
}>();

const emit = defineEmits<{
  fix: [suggestion: string];
  fixAll: [suggestions: string[]];
  updateParam: [key: UTMParamKey, value: string];
}>();

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
  <div class="space-y-5 animate-fade-in">
    <!-- Status Banner -->
    <div
      :class="[
        'flex items-center justify-between gap-3 px-5 py-4 rounded-lg border',
        getStatusInfo(result).bgClass,
      ]"
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl">{{ getStatusInfo(result).icon }}</span>
        <span :class="['text-lg font-semibold', getStatusInfo(result).textClass]">
          {{ getStatusInfo(result).text }}
        </span>
      </div>

      <!-- Fix All Button (only for errors) -->
      <button
        v-if="hasFixableErrors(result.errors)"
        @click="handleFixAll"
        class="inline-flex items-center gap-2 px-4 py-2 bg-accent-lime text-surface-900 text-sm font-semibold rounded-lg hover:bg-accent-lime/90 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Fix All
      </button>
    </div>

    <!-- Errors Section -->
    <div v-if="result.errors.length > 0" class="space-y-3">
      <h3 class="flex items-center gap-2 text-sm font-medium text-red-400 uppercase tracking-wide">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-xs">
          {{ result.errors.length }}
        </span>
        Errors
      </h3>
      <ul class="space-y-2">
        <li
          v-for="(msg, index) in result.errors"
          :key="`error-${index}`"
          class="animate-slide-in p-4 rounded-lg bg-red-500/5 border border-red-500/20"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="flex items-start gap-3">
            <span class="mt-0.5 text-sm">🔴</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-red-300">
                {{ msg.message }}
              </p>
              <div v-if="msg.suggestion" class="mt-2 flex items-center gap-2 flex-wrap">
                <span class="text-xs text-zinc-500">💡 Fix:</span>
                <button
                  @click="handleFixClick(msg.suggestion)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-lime/10 hover:bg-accent-lime/20 border border-accent-lime/30 rounded-md text-accent-lime text-xs font-mono transition-colors cursor-pointer group"
                >
                  <span>{{ msg.suggestion.split(' or ')[0] }}</span>
                  <svg
                    class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
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
    <div v-if="result.warnings.length > 0" class="space-y-3">
      <h3
        class="flex items-center gap-2 text-sm font-medium text-amber-400 uppercase tracking-wide"
      >
        <span
          class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-xs"
        >
          {{ result.warnings.length }}
        </span>
        Warnings
      </h3>
      <ul class="space-y-2">
        <li
          v-for="(msg, index) in result.warnings"
          :key="`warning-${index}`"
          class="animate-slide-in p-4 rounded-lg bg-amber-500/5 border border-amber-500/20"
          :style="{ animationDelay: `${(result.errors.length + index) * 50}ms` }"
        >
          <div class="flex items-start gap-3">
            <span class="mt-0.5 text-sm">🟡</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-amber-300">
                {{ msg.message }}
              </p>
              <div v-if="msg.suggestion" class="mt-2 flex items-center gap-2 flex-wrap">
                <span class="text-xs text-zinc-500">💡 Suggestion:</span>
                <button
                  @click="handleFixClick(msg.suggestion)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md text-amber-400 text-xs font-mono transition-colors cursor-pointer group"
                >
                  <span>{{ msg.suggestion.split(' or ')[0] }}</span>
                  <svg
                    class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
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

    <!-- Parsed Parameters Table -->
    <div class="space-y-3">
      <h3 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">
        Parsed UTM Parameters
      </h3>
      <UtmTable 
        :params="result.parsedParams" 
        :channel-id="result.channelId" 
        @update-param="handleUpdateParam"
      />
    </div>

    <!-- Clean URL Section -->
    <CleanUrl
      :original-url="originalUrl"
      :params="result.parsedParams"
      :status="getStatusInfo(result).statusType"
    />
  </div>
</template>
