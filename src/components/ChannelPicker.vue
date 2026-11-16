<script setup lang="ts">
import { computed } from 'vue';
import type { ChannelConfig } from '../lib/types';
import { channelForPlatform, channelsForPlatform, platformGroups, variantLabel } from '../lib/channels';

const props = defineProps<{
  channel: ChannelConfig | undefined;
  detected: boolean;
}>();

const emit = defineEmits<{
  pick: [channelId: string];
}>();

const groups = platformGroups();
const variants = computed(() => (props.channel ? channelsForPlatform(props.channel.platform) : []));

function pickPlatform(platform: string) {
  if (platform === props.channel?.platform) return;
  const next = channelForPlatform(platform, props.channel);
  if (next) emit('pick', next.id);
}
</script>

<template>
  <section class="space-y-3" aria-labelledby="channel-heading">
    <div class="flex items-baseline justify-between gap-4">
      <h2 id="channel-heading" class="text-[15px] font-semibold">Channel</h2>
      <span v-if="detected && channel" class="text-sm text-ink-3">Detected from your link</span>
    </div>

    <div class="space-y-2.5">
      <div v-for="group in groups" :key="group.label" class="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4 lg:flex-col lg:gap-1.5">
        <span class="w-36 shrink-0 pt-1.5 text-sm text-ink-3 lg:w-auto lg:pt-0">{{ group.label }}</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="platform in group.platforms"
            :key="platform.id"
            type="button"
            :aria-pressed="channel?.platform === platform.id"
            class="rounded-md border px-2.5 py-1 text-sm transition-colors"
            :class="
              channel?.platform === platform.id
                ? 'border-ink bg-ink text-panel font-medium'
                : 'border-line bg-panel text-ink-2 hover:border-ink-3 hover:text-ink'
            "
            @click="pickPlatform(platform.id)"
          >
            {{ platform.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="variants.length > 1" class="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-start lg:gap-1.5">
      <span class="w-36 shrink-0 text-sm text-ink-3 lg:w-auto">Traffic type</span>
      <div role="radiogroup" aria-label="Traffic type" class="inline-flex w-fit max-w-full flex-wrap rounded-lg border border-line bg-field p-0.5">
        <button
          v-for="variant in variants"
          :key="variant.id"
          type="button"
          role="radio"
          :aria-checked="variant.id === channel?.id"
          class="rounded-md px-3 py-1 text-sm transition-colors"
          :class="
            variant.id === channel?.id ? 'bg-panel text-ink font-medium shadow-sm ring-1 ring-line' : 'text-ink-3 hover:text-ink'
          "
          @click="emit('pick', variant.id)"
        >
          {{ variantLabel(variant) }}
        </button>
      </div>
    </div>
  </section>
</template>
