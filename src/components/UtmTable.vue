<script setup lang="ts">
import { ref, computed, type ComponentPublicInstance } from 'vue';
import type { ParsedUTMParams, UTMParamKey } from '../lib/types';
import { UTM_PARAM_KEYS } from '../lib/types';
import { getParamGuidance } from '../lib/validator';

const props = defineProps<{
  params: ParsedUTMParams;
  channelId?: string;
}>();

const emit = defineEmits<{
  updateParam: [key: UTMParamKey, value: string];
}>();

// Track which tooltip is open
const activeTooltip = ref<string | null>(null);

// Track which cell is being edited
const editingCell = ref<string | null>(null);
const editValue = ref('');
const isSaving = ref(false);

// Callback ref to focus input when it's mounted
function setInputRef(el: Element | ComponentPublicInstance | null) {
  if (el && el instanceof HTMLInputElement) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      el.focus();
    }, 0);
  }
}

// Get guidance for utm_content and utm_term
const paramGuidance = computed(() => {
  if (!props.channelId) return {};

  return {
    utm_content: getParamGuidance(props.channelId, 'utm_content'),
    utm_term: getParamGuidance(props.channelId, 'utm_term'),
  };
});

function toggleTooltip(param: string) {
  if (activeTooltip.value === param) {
    activeTooltip.value = null;
  } else {
    activeTooltip.value = param;
  }
}

function closeTooltip() {
  activeTooltip.value = null;
}

// Check if param should show tooltip icon
function hasGuidance(key: string): boolean {
  if (key !== 'utm_content' && key !== 'utm_term') return false;
  const guidance = paramGuidance.value[key as 'utm_content' | 'utm_term'];
  return !!(guidance?.suggestedUsage || (guidance?.examples && guidance.examples.length > 0));
}

// Start editing a cell
function startEditing(key: UTMParamKey) {
  editingCell.value = key;
  editValue.value = props.params[key] || '';
}

// Cancel editing
function cancelEditing() {
  editingCell.value = null;
  editValue.value = '';
}

// Clean and format the value
function cleanValue(value: string): string {
  if (!value.trim()) return '';
  
  // Keep {keyword} macro intact for utm_term
  let result = value;
  const keywordPlaceholder = '__KEYWORD_MACRO__';
  result = result.replace(/\{keyword\}/gi, keywordPlaceholder);
  
  // Lowercase, replace spaces with underscores
  result = result.toLowerCase();
  result = result.replace(/[\s\-–—]+/g, '_');
  result = result.replace(/[^a-z0-9_]/g, '');
  result = result.replace(/_+/g, '_');
  result = result.replace(/^_+|_+$/g, '');
  
  // Restore {keyword}
  result = result.replace(new RegExp(keywordPlaceholder, 'g'), '{keyword}');
  
  return result;
}

// Save the edited value
function saveEdit(key: UTMParamKey) {
  if (isSaving.value) return; // Prevent double-save
  isSaving.value = true;
  
  const cleanedValue = cleanValue(editValue.value);
  emit('updateParam', key, cleanedValue);
  editingCell.value = null;
  editValue.value = '';
  
  // Reset saving flag after a short delay
  setTimeout(() => {
    isSaving.value = false;
  }, 100);
}

// Handle blur - only save if not already saving
function handleBlur(key: UTMParamKey) {
  if (!isSaving.value) {
    saveEdit(key);
  }
}

// Handle key events in the input
function handleKeydown(event: KeyboardEvent, key: UTMParamKey) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    saveEdit(key);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelEditing();
  }
}

// Handle clicking on a cell to edit
function handleCellClick(key: UTMParamKey) {
  if (editingCell.value !== key) {
    startEditing(key);
  }
}
</script>

<template>
  <div class="overflow-visible rounded-lg border border-surface-600">
    <table class="w-full text-sm">
      <thead class="bg-surface-700">
        <tr>
          <th class="px-4 py-2.5 text-left font-medium text-zinc-300">Parameter</th>
          <th class="px-4 py-2.5 text-left font-medium text-zinc-300">
            <div class="flex items-center gap-2">
              Value
              <span class="text-xs text-zinc-500 font-normal">(click to edit)</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-600">
        <tr
          v-for="(key, index) in UTM_PARAM_KEYS"
          :key="key"
          class="bg-surface-800 hover:bg-surface-700 transition-colors"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <td class="px-4 py-2.5 font-mono text-accent-cyan">
            <div class="flex items-center gap-2">
              <span>{{ key }}</span>
              <!-- Tooltip Icon for utm_content and utm_term -->
              <div v-if="hasGuidance(key)" class="relative">
                <button
                  @click.stop="toggleTooltip(key)"
                  class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-600 hover:bg-surface-500 text-zinc-400 hover:text-zinc-200 transition-colors"
                  :class="{ 'bg-accent-cyan/20 text-accent-cyan': activeTooltip === key }"
                  :aria-label="`Show guidance for ${key}`"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                <!-- Tooltip Dropdown -->
                <Transition
                  enter-active-class="transition duration-150 ease-out"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-if="activeTooltip === key"
                    class="absolute left-0 top-full mt-2 z-50 w-72 p-4 bg-surface-700 border border-surface-500 rounded-lg shadow-xl"
                    @click.stop
                  >
                    <!-- Close button -->
                    <button
                      @click="closeTooltip"
                      class="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <div class="space-y-3">
                      <!-- Title -->
                      <h4 class="font-medium text-zinc-200 pr-6">
                        {{ key === 'utm_content' ? 'Content' : 'Term' }} Guidance
                      </h4>

                      <!-- Suggested Usage -->
                      <div
                        v-if="paramGuidance[key as 'utm_content' | 'utm_term']?.suggestedUsage"
                        class="space-y-1"
                      >
                        <p class="text-xs text-zinc-500 uppercase tracking-wide">Suggested Usage</p>
                        <p class="text-sm text-zinc-300">
                          {{ paramGuidance[key as 'utm_content' | 'utm_term']?.suggestedUsage }}
                        </p>
                      </div>

                      <!-- Examples -->
                      <div
                        v-if="
                          paramGuidance[key as 'utm_content' | 'utm_term']?.examples &&
                          paramGuidance[key as 'utm_content' | 'utm_term']!.examples!.length > 0
                        "
                        class="space-y-1.5"
                      >
                        <p class="text-xs text-zinc-500 uppercase tracking-wide">Examples</p>
                        <div class="flex flex-wrap gap-1.5">
                          <span
                            v-for="example in paramGuidance[key as 'utm_content' | 'utm_term']?.examples"
                            :key="example"
                            class="inline-flex px-2 py-0.5 bg-surface-600 rounded text-xs font-mono text-accent-cyan cursor-pointer hover:bg-surface-500 transition-colors"
                            @click="editValue = example"
                          >
                            {{ example }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </td>
          <td 
            class="px-4 py-1 font-mono cursor-text"
            @click="handleCellClick(key)"
          >
            <!-- Editing Mode -->
            <div v-if="editingCell === key" class="flex items-center gap-2">
              <input
                :ref="setInputRef"
                v-model="editValue"
                type="text"
                class="flex-1 px-2 py-1.5 bg-surface-900 border border-accent-cyan rounded text-zinc-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                :placeholder="`Enter ${key.replace('utm_', '')}...`"
                @keydown="handleKeydown($event, key)"
                @blur="handleBlur(key)"
              />
              <button
                @click.stop="saveEdit(key)"
                class="p-1.5 bg-accent-lime/20 hover:bg-accent-lime/30 text-accent-lime rounded transition-colors"
                title="Save (Enter)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                @click.stop="cancelEditing"
                class="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                title="Cancel (Esc)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Display Mode -->
            <div v-else class="group flex items-center gap-2 py-1.5 rounded hover:bg-surface-600/50 px-2 -mx-2">
              <span v-if="params[key]" class="text-zinc-100">{{ params[key] }}</span>
              <span v-else class="text-zinc-500 italic">click to add</span>
              <svg 
                class="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
