<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ValidationResult, UTMParamKey } from './lib/types';
import { parseUrl } from './lib/parser';
import { validateUtmParams } from './lib/validator';
import { detectChannel } from './lib/detector';
import { applyFix } from './lib/fixer';
import { getChannels, getChannelById } from './lib/rules';
import ChannelSelector from './components/ChannelSelector.vue';
import UrlInput from './components/UrlInput.vue';
import ValidationResults from './components/ValidationResults.vue';
import TrafficTypeToggle from './components/TrafficTypeToggle.vue';

// Get first available channel as default
const defaultChannelId = getChannels().find((c) => !c.disallowUtm)?.id || 'facebook_paid';

const selectedChannelId = ref<string>(defaultChannelId);
const urlInput = ref('');
const validationResult = ref<ValidationResult | null>(null);
const parseError = ref<string | null>(null);
const hasValidated = ref(false);

// Show channel selector after first validation
const showChannelSelector = computed(() => hasValidated.value);

// Get current channel's platform and traffic type
const currentChannel = computed(() => getChannelById(selectedChannelId.value));
const currentPlatform = computed(() => currentChannel.value?.platform || '');
const currentTrafficType = computed(() => currentChannel.value?.trafficType || 'paid');

// Check if current platform has both paid and organic options
const showTrafficToggle = computed(() => {
  if (!hasValidated.value || !currentPlatform.value) return false;

  const channels = getChannels();
  const platformChannels = channels.filter((c) => c.platform === currentPlatform.value);
  const hasPaid = platformChannels.some(
    (c) => c.trafficType === 'paid' || c.trafficType === 'paid_search'
  );
  const hasOrganic = platformChannels.some(
    (c) => c.trafficType === 'organic' || c.trafficType === 'organic_social' || c.trafficType === 'organic_search'
  );

  return hasPaid && hasOrganic;
});

// Debounce timer for input validation
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleValidate(autoDetect = true) {
  validationResult.value = null;
  parseError.value = null;

  if (!urlInput.value.trim()) {
    hasValidated.value = false;
    return;
  }

  const parseResult = parseUrl(urlInput.value);

  if (!parseResult.success) {
    parseError.value = parseResult.error || 'Unknown error parsing URL';
    hasValidated.value = true;
    if (parseResult.params) {
      validationResult.value = {
        isValid: false,
        hasWarnings: false,
        errors: [],
        warnings: [],
        messages: [],
        parsedParams: parseResult.params,
        channelId: selectedChannelId.value,
      };
    }
    return;
  }

  let channelToValidate = selectedChannelId.value;

  if (autoDetect) {
    const detectedChannelId = detectChannel(parseResult.params!);
    if (detectedChannelId) {
      selectedChannelId.value = detectedChannelId;
      channelToValidate = detectedChannelId;
    }
  }

  hasValidated.value = true;
  validationResult.value = validateUtmParams(parseResult.params!, channelToValidate);
}

function handlePaste() {
  handleValidate(true);
}

function handleInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => handleValidate(false), 300);
}

function handleChannelChange() {
  if (urlInput.value.trim() && hasValidated.value) {
    handleValidate(false);
  }
}

function handleTrafficTypeChange(isPaid: boolean) {
  const channels = getChannels();
  const targetType = isPaid ? 'paid' : 'organic';

  // Find the channel with same platform but different traffic type
  const newChannel = channels.find(
    (c) =>
      c.platform === currentPlatform.value &&
      (c.trafficType === targetType ||
        c.trafficType === `${targetType}_search` ||
        c.trafficType === `${targetType}_social`)
  );

  if (newChannel) {
    selectedChannelId.value = newChannel.id;
    if (urlInput.value.trim() && hasValidated.value) {
      handleValidate(false);
    }
  }
}

function handleFix(suggestion: string) {
  const fixedUrl = applyFix(urlInput.value, suggestion);
  if (fixedUrl !== urlInput.value) {
    urlInput.value = fixedUrl;
    handleValidate(false);
  }
}

function handleFixAll(suggestions: string[]) {
  // Use applyAllFixes which only applies error fixes
  const currentUrl = urlInput.value;
  let fixedUrl = currentUrl;
  
  for (const suggestion of suggestions) {
    fixedUrl = applyFix(fixedUrl, suggestion);
  }
  
  if (fixedUrl !== currentUrl) {
    urlInput.value = fixedUrl;
    handleValidate(false);
  }
}

function handleUpdateParam(key: UTMParamKey, value: string) {
  // Update the URL with the new parameter value
  try {
    const currentUrl = urlInput.value;
    const urlString = currentUrl.startsWith('http://') || currentUrl.startsWith('https://')
      ? currentUrl
      : `https://${currentUrl}`;
    
    const url = new URL(urlString);
    
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    
    urlInput.value = url.toString();
    handleValidate(false);
  } catch {
    // If URL parsing fails, just apply via the fix mechanism
    if (value) {
      handleFix(`${key}=${value}`);
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface-900 py-6 px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <header class="text-center mb-6 lg:mb-8">
      <h1
        class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2"
        style="
          font-family: 'Syne', sans-serif;
          background: linear-gradient(135deg, #00d4ff 0%, #c4ff00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        "
      >
        UTM Builder
      </h1>
      <p class="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
        Paste your URL, fix issues with one click, and get properly formatted UTM parameters.
      </p>
    </header>

    <!-- Main Content - Two Column Layout on Large Screens -->
    <div class="max-w-7xl mx-auto overflow-hidden">
      <div class="flex flex-col lg:flex-row lg:items-start gap-6">
        <!-- Left Panel: Input & Controls -->
        <div class="w-full lg:w-[380px] lg:flex-shrink-0">
          <div class="bg-surface-800 rounded-2xl border border-surface-600 p-5 sm:p-6 shadow-2xl lg:sticky lg:top-6 h-full">
            <div class="space-y-5">
              <!-- URL Input -->
              <UrlInput v-model="urlInput" @paste="handlePaste" @input="handleInput" />

              <!-- Channel Selector -->
              <ChannelSelector
                v-model="selectedChannelId"
                :visible="showChannelSelector"
                @update:model-value="handleChannelChange"
              />

              <!-- Paid/Organic Toggle -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <TrafficTypeToggle
                  v-if="showTrafficToggle"
                  :is-paid="currentTrafficType === 'paid' || currentTrafficType === 'paid_search'"
                  @update:is-paid="handleTrafficTypeChange"
                />
              </Transition>
            </div>

            <!-- Parse Error (in left panel) -->
            <div
              v-if="parseError"
              class="mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in"
            >
              <div class="flex items-start gap-3">
                <span class="text-lg">❌</span>
                <p class="text-red-300 text-sm">{{ parseError }}</p>
              </div>
            </div>

            <!-- Empty State for Right Panel -->
            <div v-if="!validationResult && !parseError && hasValidated" class="mt-5 p-4 bg-surface-700/50 rounded-lg text-center">
              <p class="text-zinc-500 text-sm">Enter a URL to see validation results</p>
            </div>
          </div>
        </div>

        <!-- Right Panel: Validation Results -->
        <div class="flex-1 min-w-0 overflow-hidden">
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4 lg:translate-y-0 lg:translate-x-4"
            enter-to-class="opacity-100 translate-y-0 lg:translate-x-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <main v-if="validationResult" class="bg-surface-800 rounded-2xl border border-surface-600 p-5 sm:p-6 shadow-2xl h-full">
              <ValidationResults
                :result="validationResult"
                :original-url="urlInput"
                @fix="handleFix"
                @fix-all="handleFixAll"
                @update-param="handleUpdateParam"
              />
            </main>
          </Transition>

          <!-- Placeholder when no results -->
          <div v-if="!validationResult && !hasValidated" class="hidden lg:flex items-center justify-center h-64 bg-surface-800/50 rounded-2xl border border-surface-600/50 border-dashed">
            <div class="text-center">
              <div class="text-4xl mb-3 opacity-30">🔗</div>
              <p class="text-zinc-500">Paste a URL to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="mt-8 text-center text-zinc-500 text-sm">
      <p>Build consistent UTM parameters for your marketing campaigns.</p>
    </footer>
  </div>
</template>
