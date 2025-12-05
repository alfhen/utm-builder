import type { UtmRulesConfig, ChannelConfig } from './types';
import rulesConfig from '../config/utm-rules.json';

// Type assertion for the imported JSON
const config = rulesConfig as UtmRulesConfig;

/**
 * Get the full rules configuration
 */
export function getRulesConfig(): UtmRulesConfig {
  return config;
}

/**
 * Get all channel configurations
 */
export function getChannels(): ChannelConfig[] {
  return config.channels;
}

/**
 * Get a specific channel by ID
 */
export function getChannelById(id: string): ChannelConfig | undefined {
  return config.channels.find(c => c.id === id);
}

/**
 * Get channels grouped by platform
 */
export function getChannelsByPlatform(): Map<string, ChannelConfig[]> {
  const grouped = new Map<string, ChannelConfig[]>();
  
  for (const channel of config.channels) {
    const existing = grouped.get(channel.platform) || [];
    existing.push(channel);
    grouped.set(channel.platform, existing);
  }
  
  return grouped;
}

/**
 * Get unique platforms that have both paid and organic options
 */
export function getPlatformsWithTrafficTypes(): string[] {
  const platformTrafficTypes = new Map<string, Set<string>>();
  
  for (const channel of config.channels) {
    const types = platformTrafficTypes.get(channel.platform) || new Set();
    types.add(channel.trafficType);
    platformTrafficTypes.set(channel.platform, types);
  }
  
  return Array.from(platformTrafficTypes.entries())
    .filter(([_, types]) => types.has('paid') && types.has('organic'))
    .map(([platform]) => platform);
}

/**
 * Check if a channel supports paid/organic toggle
 */
export function channelHasTrafficTypeToggle(channelId: string): boolean {
  const channel = getChannelById(channelId);
  if (!channel) return false;
  
  const platformChannels = config.channels.filter(c => c.platform === channel.platform);
  const hasPaid = platformChannels.some(c => c.trafficType === 'paid');
  const hasOrganic = platformChannels.some(c => c.trafficType === 'organic');
  
  return hasPaid && hasOrganic;
}

/**
 * Get the channel ID for a platform and traffic type
 */
export function getChannelIdForPlatformAndType(platform: string, trafficType: string): string | undefined {
  const channel = config.channels.find(
    c => c.platform === platform && c.trafficType === trafficType
  );
  return channel?.id;
}

/**
 * Get global rules
 */
export function getGlobalRules() {
  return config.globalRules;
}

