<script setup lang="ts">
import type { ChannelConfig, ParsedUTMParams, UTMParamKey, ValidationMessage, ValidationResult } from '../lib/types';
import { UTM_PARAM_KEYS } from '../lib/types';
import { PARAM_META } from '../lib/channels';
import { cleanUtmValue } from '../lib/validator';

const props = defineProps<{
  params: ParsedUTMParams;
  result: ValidationResult | null;
  channel: ChannelConfig | undefined;
  disabled: boolean;
  active: UTMParamKey | null;
}>();

const emit = defineEmits<{
  update: [key: UTMParamKey, value: string];
  fix: [suggestion: string];
  active: [key: UTMParamKey | null];
}>();

function messagesFor(key: UTMParamKey): ValidationMessage[] {
  return props.result?.messages.filter((m) => m.param === key) ?? [];
}

function isRequired(key: UTMParamKey): boolean {
  return !!props.channel?.rules[key]?.required;
}

function suggestionValue(suggestion: string): string {
  return (suggestion.split(' or ')[0] ?? '').split('=')[1] ?? '';
}

function chipsFor(key: UTMParamKey): string[] {
  const rule = props.channel?.rules[key];
  if (!rule) return [];
  if (rule.allowedValues && rule.allowedValues.length > 1) return rule.allowedValues;
  return rule.examples ?? [];
}

function commit(key: UTMParamKey, event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  const cleaned = cleanUtmValue(raw, !!props.channel?.rules[key]?.allowKeywordMacro);
  if (cleaned !== raw && (cleaned || !raw.trim())) emit('update', key, cleaned);
}
</script>

<template>
  <section aria-labelledby="params-heading" class="space-y-3">
    <div class="flex items-baseline justify-between gap-4">
      <h2 id="params-heading" class="text-[15px] font-semibold">Parameters</h2>
      <span class="text-sm text-ink-3">Values are lowercased and spaces become underscores</span>
    </div>

    <p v-if="disabled" class="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-ink-3">
      Add a destination URL above to start filling these in.
    </p>

    <div class="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel" :class="{ 'opacity-60': disabled }">
      <div
        v-for="key in UTM_PARAM_KEYS"
        :key="key"
        class="relative grid gap-x-6 gap-y-2 px-4 py-4 transition-colors sm:grid-cols-[11rem_1fr] sm:px-5"
        :class="{ 'bg-field/70': active === key }"
        :style="{ '--tag': PARAM_META[key].color }"
        @mouseenter="emit('active', key)"
        @mouseleave="emit('active', null)"
      >
        <span
          aria-hidden="true"
          class="absolute inset-y-0 left-0 w-[3px] bg-[var(--tag)] transition-opacity"
          :class="active === key ? 'opacity-100' : 'opacity-40'"
        />

        <div>
          <label :for="`f-${key}`" class="flex items-center gap-2 font-medium">
            {{ PARAM_META[key].label }}
            <span v-if="isRequired(key)" class="text-xs font-normal text-ink-3">required</span>
          </label>
          <p class="mt-0.5 text-sm leading-snug text-ink-3">{{ PARAM_META[key].hint }}</p>
        </div>

        <div class="min-w-0 space-y-2">
          <div class="flex items-center rounded-lg border border-line bg-field focus-within:border-[var(--tag)] focus-within:ring-1 focus-within:ring-[var(--tag)]">
            <span class="select-none pl-3 font-mono text-xs text-[var(--tag)]">{{ key }}=</span>
            <input
              :id="`f-${key}`"
              :value="params[key] ?? ''"
              :disabled="disabled"
              :aria-invalid="messagesFor(key).some((m) => m.type === 'error')"
              :aria-describedby="`m-${key}`"
              type="text"
              spellcheck="false"
              autocomplete="off"
              class="min-w-0 flex-1 bg-transparent py-2 pr-3 pl-0.5 font-mono text-sm text-ink placeholder:text-ink-3/70 focus:outline-none disabled:cursor-not-allowed"
              :placeholder="chipsFor(key)[0] ? `e.g. ${chipsFor(key)[0]}` : ''"
              @input="emit('update', key, ($event.target as HTMLInputElement).value)"
              @focus="emit('active', key)"
              @blur="commit(key, $event); emit('active', null)"
              @keydown.enter="commit(key, $event)"
            />
          </div>

          <div :id="`m-${key}`" aria-live="polite" class="space-y-1.5">
            <div
              v-for="(msg, i) in messagesFor(key)"
              :key="i"
              class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
              :class="msg.type === 'error' ? 'text-err' : 'text-warn'"
            >
              <svg class="size-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle v-if="msg.type === 'error'" cx="8" cy="8" r="6" />
                <path v-else d="M8 2 15 14H1z" />
              </svg>
              <span>{{ msg.message }}</span>
              <button
                v-if="msg.suggestion && !disabled"
                type="button"
                class="rounded-md border border-current/40 px-2 py-0.5 text-xs font-medium hover:bg-current/10"
                @click="emit('fix', msg.suggestion)"
              >
                Use <span class="font-mono">{{ suggestionValue(msg.suggestion) }}</span>
              </button>
            </div>
            <p v-if="!messagesFor(key).length && params[key]" class="flex items-center gap-1.5 text-sm text-ok">
              <svg class="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m3 8.5 3 3 7-7" />
              </svg>
              Looks good
            </p>
          </div>

          <div v-if="chipsFor(key).length && !disabled" class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-ink-3">{{ (channel?.rules[key]?.allowedValues?.length ?? 0) > 1 ? 'Allowed' : 'Examples' }}</span>
            <button
              v-for="chip in chipsFor(key)"
              :key="chip"
              type="button"
              class="rounded border px-1.5 py-px font-mono text-xs transition-colors"
              :class="
                params[key] === chip
                  ? 'border-[var(--tag)] text-[var(--tag)]'
                  : 'border-line text-ink-2 hover:border-[var(--tag)] hover:text-[var(--tag)]'
              "
              @click="emit('update', key, chip)"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
