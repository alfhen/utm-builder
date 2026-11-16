<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { UTMParamKey, ValidationResult } from './lib/types';
import { parseUrl, toUrl } from './lib/parser';
import { validateUtmParams } from './lib/validator';
import { detectChannel } from './lib/detector';
import { applyFix, buildCleanUrl, setParam, stripUtmParams } from './lib/fixer';
import { getChannelById, getChannels } from './lib/rules';
import { platformLabel } from './lib/channels';
import UrlInput from './components/UrlInput.vue';
import ChannelPicker from './components/ChannelPicker.vue';
import ParamFields from './components/ParamFields.vue';
import ResultBar from './components/ResultBar.vue';
import RecentLinks from './components/RecentLinks.vue';
import ThemeSwitch from './components/ThemeSwitch.vue';
import { loadRecentLinks, saveRecentLinks, type RecentLink } from './lib/recent';

const EXAMPLE_URL =
  'https://example.com/collections/merino-yarn?ref=nav&utm_source=Facebook&utm_medium=social&utm_campaign=Black Friday 2026';

const urlInput = ref('');
const selectedChannelId = ref(getChannels().find((c) => !c.disallowUtm)?.id ?? '');
const channelDetected = ref(false);
const channelPickedByUser = ref(false);
const result = ref<ValidationResult | null>(null);
const parseError = ref<string | null>(null);
const activeParam = ref<UTMParamKey | null>(null);
const started = ref(false);

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
    if (detected) selectedChannelId.value = detected;
    channelDetected.value = !!detected;
  }

  result.value = validateUtmParams(parsed.params, selectedChannelId.value);
}

function setStarted(value: boolean) {
  if (started.value === value) return;
  const wasTyping = document.activeElement?.id === 'url-input';

  // The URL field is a different element in each layout, so focus and caret must be carried over.
  const swap = async () => {
    started.value = value;
    await nextTick();
    const field = document.getElementById('url-input') as HTMLTextAreaElement | null;
    if (field && (wasTyping || !value)) {
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduceMotion) swap();
  else document.startViewTransition(swap);
}

function startIfValid() {
  if (result.value) setStarted(true);
}

function looksComplete(url: string): boolean {
  try {
    return /\.[a-z]{2,}$/i.test(toUrl(url).hostname);
  } catch {
    return false;
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined;
function onUrlTyped() {
  clearTimeout(debounce);
  if (started.value) {
    debounce = setTimeout(() => validate(!channelPickedByUser.value), 300);
    return;
  }
  parseError.value = null;
  debounce = setTimeout(() => {
    if (!looksComplete(urlInput.value)) return;
    validate(true);
    startIfValid();
  }, 900);
}

function onUrlPasted() {
  clearTimeout(debounce);
  channelPickedByUser.value = false;
  validate(true);
  startIfValid();
}

function onUrlSubmitted() {
  clearTimeout(debounce);
  validate(!channelPickedByUser.value);
  startIfValid();
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
  setStarted(false);
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

const recent = ref<RecentLink[]>(loadRecentLinks());

function rememberLink(url: string) {
  const entry: RecentLink = {
    url,
    channelLabel: channel.value?.label ?? '',
    campaign: params.value.utm_campaign ?? '',
    copiedAt: Date.now(),
  };
  recent.value = [entry, ...recent.value.filter((l) => l.url !== url)].slice(0, 8);
  saveRecentLinks(recent.value);
}

function loadRecent(url: string) {
  urlInput.value = url;
  onUrlPasted();
  window.scrollTo({ top: 0 });
}

function clearRecent() {
  recent.value = [];
  saveRecentLinks([]);
}

function fixAll() {
  const suggestions = result.value?.errors.flatMap((e) => (e.suggestion ? [e.suggestion] : [])) ?? [];
  updateUrl(suggestions.reduce(applyFix, urlInput.value));
}
</script>

<template>
  <ThemeSwitch class="absolute top-4 right-4 z-20" />

  <div v-if="!started" class="flex min-h-screen flex-col items-center justify-center px-4 py-16">
    <div class="w-full max-w-2xl -translate-y-[6vh] space-y-8">
      <header class="text-center" style="view-transition-name: brand">
        <h1 class="text-[34px] leading-tight font-semibold tracking-tight sm:text-[44px]">UTM Builder</h1>
        <p class="mt-2 text-[15px] text-ink-2 sm:text-base">
          Paste the page you are linking to. You will pick the channel and fill in the tags next.
        </p>
      </header>
      <UrlInput
        v-model="urlInput"
        hero
        :error="parseError"
        @paste="onUrlPasted"
        @input="onUrlTyped"
        @submit="onUrlSubmitted"
        @example="loadExample"
      />
      <RecentLinks :links="recent.slice(0, 4)" class="pt-6" @load="loadRecent" @clear="clearRecent" />
    </div>
  </div>

  <div
    v-else
    class="mx-auto flex min-h-screen max-w-3xl flex-col px-4 sm:px-6 lg:grid lg:max-w-[1360px] lg:grid-cols-[minmax(340px,400px)_1fr] lg:items-start lg:gap-x-14 lg:px-10"
  >
    <aside class="space-y-9 lg:pb-14">
      <header class="pt-16 sm:pt-14" style="view-transition-name: brand">
        <h1 class="text-[28px] leading-tight font-semibold tracking-tight sm:text-[32px]">UTM Builder</h1>
        <p class="mt-1.5 max-w-xl text-[15px] text-ink-2">
          Tag a link for any channel, or paste one that is already tagged to check it against the naming rules.
        </p>
      </header>

      <UrlInput
        v-model="urlInput"
        :error="parseError"
        @paste="onUrlPasted"
        @input="onUrlTyped"
        @submit="onUrlSubmitted"
        @clear="clearUrl"
      />

      <ChannelPicker class="reveal" style="animation-delay: 0.15s" :channel="channel" :detected="channelDetected" @pick="pickChannel" />

      <RecentLinks :links="recent" class="reveal hidden lg:block" style="animation-delay: 0.35s" @load="loadRecent" @clear="clearRecent" />
    </aside>

    <div class="contents lg:flex lg:flex-col lg:pt-8">
      <ResultBar
        :url="cleanUrl"
        :result="result"
        :has-parse-error="!!parseError"
        :active="activeParam"
        class="reveal order-last mt-10 lg:order-first lg:mt-0"
        style="animation-delay: 0.1s"
        @fix-all="fixAll"
        @copied="rememberLink"
        @active="(k) => (activeParam = k)"
      />

      <main class="reveal mt-9 flex-1 space-y-9 lg:mt-4 lg:pb-14" style="animation-delay: 0.25s">
        <section v-if="channel?.disallowUtm" class="rounded-xl border border-line bg-panel px-5 py-4" aria-live="polite">
          <h2 class="font-semibold">Leave this link untagged</h2>
          <p class="mt-1 text-sm text-ink-2">
            Visits from organic {{ platformLabel(channel.platform) }} search are attributed automatically. UTM tags here
            would overwrite that and misreport the traffic.
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

        <RecentLinks :links="recent" class="lg:hidden" @load="loadRecent" @clear="clearRecent" />
      </main>
    </div>
  </div>
</template>
