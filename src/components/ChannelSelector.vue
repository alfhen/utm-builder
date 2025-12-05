<script setup lang="ts">
import { computed } from 'vue';
import { getChannels } from '../lib/rules';
import type { ChannelConfig } from '../lib/types';

const modelValue = defineModel<string>({ required: true });

defineProps<{
  visible?: boolean;
}>();

// Group channels by platform, showing only unique platforms
// For platforms with multiple traffic types, we'll show a toggle separately
const channels = computed(() => {
  const allChannels = getChannels();
  const seen = new Map<string, ChannelConfig>();
  
  // Prefer paid channels for display, but store the base platform
  for (const channel of allChannels) {
    if (channel.disallowUtm) continue;
    
    const existing = seen.get(channel.platform);
    // Prefer paid versions for the main selector
    if (!existing || channel.trafficType === 'paid' || channel.trafficType === 'paid_search') {
      seen.set(channel.platform, channel);
    }
  }
  
  return Array.from(seen.values()).map(channel => ({
    id: channel.id,
    platform: channel.platform,
    label: getPlatformLabel(channel.platform),
    shortLabel: getShortLabel(channel.platform),
  }));
});

function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    pinterest: 'Pinterest',
    snapchat: 'Snapchat',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    twitter: 'Twitter / X',
    reddit: 'Reddit',
    google: 'Google Ads',
    bing: 'Bing Ads',
    email: 'Email',
    influencer: 'Influencer',
    affiliate: 'Affiliate',
    referral: 'Referral',
  };
  return labels[platform] || platform;
}

function getShortLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: 'FB',
    instagram: 'IG',
    tiktok: 'TikTok',
    pinterest: 'Pin',
    snapchat: 'Snap',
    youtube: 'YT',
    linkedin: 'LI',
    twitter: 'X',
    reddit: 'Reddit',
    google: 'Google',
    bing: 'Bing',
    email: 'Email',
    influencer: 'Influencer',
    affiliate: 'Affiliate',
    referral: 'Referral',
  };
  return labels[platform] || platform;
}

// Get the platform from the current selected channel ID
const selectedPlatform = computed(() => {
  const allChannels = getChannels();
  const channel = allChannels.find(c => c.id === modelValue.value);
  return channel?.platform || '';
});

function selectChannel(channelId: string, platform: string) {
  // If clicking the same platform, keep the current traffic type
  const allChannels = getChannels();
  const currentChannel = allChannels.find(c => c.id === modelValue.value);
  
  if (currentChannel && currentChannel.platform !== platform) {
    // Switching platforms - find matching traffic type or default to paid
    const targetChannel = allChannels.find(
      c => c.platform === platform && c.trafficType === currentChannel.trafficType
    ) || allChannels.find(
      c => c.platform === platform && (c.trafficType === 'paid' || c.trafficType === 'paid_search')
    ) || allChannels.find(c => c.platform === platform);
    
    if (targetChannel) {
      modelValue.value = targetChannel.id;
    }
  } else {
    modelValue.value = channelId;
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div v-if="visible" class="space-y-2">
      <label class="block text-sm font-medium text-zinc-300">
        Channel
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="channel in channels"
          :key="channel.id"
          type="button"
          @click="selectChannel(channel.id, channel.platform)"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
          :class="[
            selectedPlatform === channel.platform
              ? 'bg-accent-cyan text-surface-900 shadow-lg shadow-accent-cyan/25'
              : 'bg-surface-700 text-zinc-300 hover:bg-surface-600 hover:text-zinc-100'
          ]"
        >
          <span class="hidden sm:inline">{{ channel.label }}</span>
          <span class="sm:hidden">{{ channel.shortLabel }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
