<script setup lang="ts">
import type { ValidationResult, ValidationMessage } from '../lib/types';
import UtmTable from './UtmTable.vue';

const props = defineProps<{
  result: ValidationResult;
}>();

const emit = defineEmits<{
  fix: [suggestion: string]
  fixAll: [suggestions: string[]]
}>();

function getStatusInfo(result: ValidationResult) {
  if (result.isValid && !result.hasWarnings) {
    return {
      icon: '✅',
      text: 'Ready to use',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      textClass: 'text-emerald-400',
    };
  }
  if (result.isValid && result.hasWarnings) {
    return {
      icon: '⚠️',
      text: 'Ready (with suggestions)',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      textClass: 'text-amber-400',
    };
  }
  return {
    icon: '❌',
    text: 'Needs fixes',
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-400',
  };
}

function handleFixClick(suggestion: string) {
  emit('fix', suggestion);
}

function handleFixAll() {
  const suggestions = props.result.messages
    .filter((m): m is ValidationMessage & { suggestion: string } => !!m.suggestion)
    .map(m => m.suggestion);
  if (suggestions.length > 0) {
    emit('fixAll', suggestions);
  }
}

// Check if there are any fixable issues
function hasFixableSuggestions(messages: ValidationMessage[]) {
  return messages.some(m => m.suggestion);
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
      
      <!-- Fix All Button -->
      <button
        v-if="hasFixableSuggestions(result.messages)"
        @click="handleFixAll"
        class="inline-flex items-center gap-2 px-4 py-2 bg-accent-lime text-surface-900 text-sm font-semibold rounded-lg hover:bg-accent-lime/90 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Fix All
      </button>
    </div>

    <!-- Errors and Warnings -->
    <div v-if="result.messages.length > 0" class="space-y-3">
      <h3 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">
        Issues Found
      </h3>
      <ul class="space-y-2">
        <li
          v-for="(msg, index) in result.messages"
          :key="index"
          class="animate-slide-in p-4 rounded-lg"
          :class="[
            msg.type === 'error'
              ? 'bg-red-500/5 border border-red-500/20'
              : 'bg-amber-500/5 border border-amber-500/20',
          ]"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="flex items-start gap-3">
            <span class="mt-0.5 text-sm">
              {{ msg.type === 'error' ? '🔴' : '🟡' }}
            </span>
            <div class="flex-1 min-w-0">
              <p
                :class="[
                  'text-sm',
                  msg.type === 'error' ? 'text-red-300' : 'text-amber-300',
                ]"
              >
                {{ msg.message }}
              </p>
              <div v-if="msg.suggestion" class="mt-2 flex items-center gap-2 flex-wrap">
                <span class="text-xs text-zinc-500">💡 Fix:</span>
                <button
                  @click="handleFixClick(msg.suggestion)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-lime/10 hover:bg-accent-lime/20 border border-accent-lime/30 rounded-md text-accent-lime text-xs font-mono transition-colors cursor-pointer group"
                >
                  <span>{{ msg.suggestion.split(' or ')[0] }}</span>
                  <svg class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
      <UtmTable :params="result.parsedParams" />
    </div>
  </div>
</template>
