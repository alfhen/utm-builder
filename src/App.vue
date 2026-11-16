<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UTMParamKey, ValidationResult } from './lib/types';
import { parseUrl } from './lib/parser';
import { validateUtmParams } from './lib/validator';
import { detectChannel } from './lib/detector';
import { applyFix, buildCleanUrl, setParam, stripUtmParams } from './lib/fixer';
import { getChannelById, getChannels } from './lib/rules';
import { platformLabel } from './lib/channels';
import UrlInput from './components/UrlInput.vue';
import ChannelPicker from './components/ChannelPicker.vue';
import ParamFields from './components/ParamFields.vue';
import ResultBar from './components/ResultBar.vue';

const EXAMPLE_URL =
  'https://example.com/collections/merino-yarn?ref=nav&utm_source=Facebook&utm_medium=social&utm_campaign=Black Friday 2026';

const urlInput = ref('');
const selectedChannelId = ref(getChannels().find((c) => !c.disallowUtm)?.id ?? '');
const channelDetected = ref(false);
const channelPickedByUser = ref(false);
const result = ref<ValidationResult | null>(null);
const parseError = ref<string | null>(null);
const activeParam = ref<UTMParamKey | null>(null);

const channel = computed(() => getChannelById(selectedChannelId.value));
const params = computed(() => result.value?.parsedParams ?? {});
const cleanUrl = computed(() => (result.value ? buildCleanUrl(urlInput.value, result.value.parsedParams) : ''));
const hasUtm = computed(() => Object.values(params.value).some(Boolean));
const generalMessages = computed(() => result.value?.messages.filter((m) => !m.param) ?? []);

function validate(autoDetect: boolean) {
  result.value = null;
  parseError.value = null;
  if (!urlInput.value.trim()) return;

  const parsed = parseUrl(urlInput.value);
  if (!parsed.success || !parsed.params) {
    parseError.value = parsed.error ?? 'This doesn’t look like a URL.';
    return;
  }

  if (autoDetect) {
    const detected = detectChannel(parsed.params);
    if (detected) {
      selectedChannelId.value = detected;
      channelDetected.value = true;
    }
  }

  result.value = validateUtmParams(parsed.params, selectedChannelId.value);
}

let debounce: ReturnType<typeof setTimeout> | undefined;
function onUrlTyped() {
  clearTimeout(debounce);
  debounce = setTimeout(() => validate(!channelPickedByUser.value), 300);
}

function onUrlPasted() {
  clearTimeout(debounce);
  channelPickedByUser.value = false;
  validate(true);
}

function loadExample() {
  urlInput.value = EXAMPLE_URL;
  onUrlPasted();
}

function clearUrl() {
  urlInput.value = '';
  channelDetected.value = false;
  channelPickedByUser.value = false;
  validate(false);
  document.getElementById('url-input')?.focus();
}

function updateUrl(next: string) {
  if (next === urlInput.value) return;
  urlInput.value = next;
  validate(false);
}

function pickChannel(id: string) {
  selectedChannelId.value = id;
  channelDetected.value = false;
  channelPickedByUser.value = true;

  const picked = getChannelById(id);
  let next = urlInput.value;
  if (picked && !picked.disallowUtm && result.value) {
    for (const key of ['utm_source', 'utm_medium'] as const) {
      const rule = picked.rules[key];
      const current = params.value[key];
      if (rule?.preferredValue && !(current && rule.allowedValues?.includes(current))) {
        next = setParam(next, key, rule.preferredValue);
      }
    }
  }
  urlInput.value = next;
  validate(false);
}

function fixAll() {
  const suggestions = result.value?.errors.flatMap((e) => (e.suggestion ? [e.suggestion] : [])) ?? [];
  updateUrl(suggestions.reduce(applyFix, urlInput.value));
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-3xl flex-col px-4 sm:px-6">
    <header class="pt-10 pb-8 sm:pt-14">
      <h1 class="text-[28px] leading-tight font-semibold tracking-tight sm:text-[32px]">UTM Builder</h1>
      <p class="mt-1.5 max-w-xl text-[15px] text-ink-2">
        Tag a link for any channel, or paste one that is already tagged to check it against the naming rules.
      </p>
    </header>

    <main class="flex-1 space-y-9">
      <UrlInput
        v-model="urlInput"
        :error="parseError"
        @paste="onUrlPasted"
        @input="onUrlTyped"
        @example="loadExample"
        @clear="clearUrl"
      />

      <ChannelPicker :channel="channel" :detected="channelDetected" @pick="pickChannel" />

      <section
        v-if="channel?.disallowUtm"
        class="rounded-xl border border-line bg-panel px-5 py-4"
        aria-live="polite"
      >
        <h2 class="font-semibold">Leave this link untagged</h2>
        <p class="mt-1 text-sm text-ink-2">
          Visits from organic {{ platformLabel(channel.platform) }} search are attributed automatically. UTM tags here would
          overwrite that and misreport the traffic.
        </p>
        <button
          v-if="hasUtm"
          type="button"
          class="mt-3 rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-panel hover:opacity-90"
          @click="updateUrl(stripUtmParams(urlInput))"
        >
          Remove UTM parameters
        </button>
      </section>

      <template v-else>
        <p
          v-for="(msg, i) in generalMessages"
          :key="i"
          class="rounded-lg border border-err/40 px-4 py-3 text-sm text-err"
        >
          {{ msg.message }}
        </p>
        <ParamFields
          :params="params"
          :result="result"
          :channel="channel"
          :disabled="!result"
          :active="activeParam"
          @update="(key, value) => updateUrl(setParam(urlInput, key, value))"
          @fix="(s) => updateUrl(applyFix(urlInput, s))"
          @active="(k) => (activeParam = k)"
        />
      </template>
    </main>

    <ResultBar
      :url="cleanUrl"
      :result="result"
      :has-parse-error="!!parseError"
      :active="activeParam"
      class="mt-10"
      @fix-all="fixAll"
      @active="(k) => (activeParam = k)"
    />
  </div>
</template>
