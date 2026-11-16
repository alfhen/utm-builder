import type { ChannelConfig, UTMParamKey } from './types';
import { getChannels } from './rules';

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  snapchat: 'Snapchat',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  reddit: 'Reddit',
  google: 'Google',
  bing: 'Microsoft / Bing',
  email: 'Email',
  influencer: 'Influencer',
  affiliate: 'Affiliate',
  referral: 'Referral',
};

const VARIANT_LABELS: Record<string, string> = {
  paid: 'Paid',
  organic: 'Organic',
  paid_search: 'Search ads',
  display: 'Display ads',
  organic_search: 'Organic search',
};

const GROUPS: { label: string; platforms: string[] }[] = [
  {
    label: 'Social',
    platforms: ['facebook', 'instagram', 'tiktok', 'pinterest', 'snapchat', 'youtube', 'linkedin', 'twitter', 'reddit'],
  },
  { label: 'Search', platforms: ['google', 'bing'] },
];
const FALLBACK_GROUP = 'Owned & partners';

export interface PlatformOption {
  id: string;
  label: string;
}

export interface PlatformGroup {
  label: string;
  platforms: PlatformOption[];
}

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function variantLabel(channel: ChannelConfig): string {
  return VARIANT_LABELS[channel.trafficType] ?? channel.label;
}

export function platformGroups(): PlatformGroup[] {
  const platforms = [...new Set(getChannels().map((c) => c.platform))];
  const groups: PlatformGroup[] = GROUPS.map((g) => ({
    label: g.label,
    platforms: g.platforms.filter((p) => platforms.includes(p)).map((id) => ({ id, label: platformLabel(id) })),
  }));
  const grouped = new Set(GROUPS.flatMap((g) => g.platforms));
  groups.push({
    label: FALLBACK_GROUP,
    platforms: platforms.filter((p) => !grouped.has(p)).map((id) => ({ id, label: platformLabel(id) })),
  });
  return groups.filter((g) => g.platforms.length > 0);
}

export function channelsForPlatform(platform: string): ChannelConfig[] {
  return getChannels().filter((c) => c.platform === platform);
}

const isPaid = (c: ChannelConfig) => c.trafficType === 'paid' || c.trafficType === 'paid_search';

/** Picks a channel on a new platform, keeping the paid/organic choice when the platform has it. */
export function channelForPlatform(platform: string, current?: ChannelConfig): ChannelConfig | undefined {
  const options = channelsForPlatform(platform).filter((c) => !c.disallowUtm);
  return (
    options.find((c) => c.trafficType === current?.trafficType) ??
    options.find(isPaid) ??
    options[0] ??
    channelsForPlatform(platform)[0]
  );
}

export const PARAM_META: Record<UTMParamKey, { label: string; hint: string; color: string }> = {
  utm_source: { label: 'Source', hint: 'The site or platform sending the visit', color: 'var(--p-source)' },
  utm_medium: { label: 'Medium', hint: 'The kind of traffic', color: 'var(--p-medium)' },
  utm_campaign: { label: 'Campaign', hint: 'The campaign this link belongs to', color: 'var(--p-campaign)' },
  utm_content: { label: 'Content', hint: 'Which ad, creative or link was clicked', color: 'var(--p-content)' },
  utm_term: { label: 'Term', hint: 'The audience or keyword targeted', color: 'var(--p-term)' },
};
