import type { ParsedUTMParams } from './types';
import { getChannels } from './rules';

/**
 * Auto-detect the channel ID from UTM parameters
 */
export function detectChannel(params: ParsedUTMParams): string | null {
  const { utm_source, utm_medium } = params;
  
  if (!utm_source && !utm_medium) return null;

  const source = utm_source?.toLowerCase();
  const medium = utm_medium?.toLowerCase();
  const channels = getChannels();

  // First, try to find an exact match on both source and medium
  for (const channel of channels) {
    if (channel.disallowUtm) continue;
    
    const sourceRule = channel.rules.utm_source;
    const mediumRule = channel.rules.utm_medium;
    
    const sourceMatches = sourceRule?.allowedValues?.includes(source || '') || 
                          (sourceRule?.freeTextAllowed && source);
    const mediumMatches = mediumRule?.allowedValues?.includes(medium || '');
    
    if (sourceMatches && mediumMatches) {
      return channel.id;
    }
  }

  // Second, try to match on source only (prefer paid channels)
  if (source) {
    // Try paid first
    for (const channel of channels) {
      if (channel.disallowUtm) continue;
      if (channel.trafficType !== 'paid' && channel.trafficType !== 'paid_search') continue;
      
      const sourceRule = channel.rules.utm_source;
      if (sourceRule?.allowedValues?.includes(source)) {
        return channel.id;
      }
    }
    
    // Then try any channel
    for (const channel of channels) {
      if (channel.disallowUtm) continue;
      
      const sourceRule = channel.rules.utm_source;
      if (sourceRule?.allowedValues?.includes(source)) {
        return channel.id;
      }
    }
  }

  // Third, try to match on medium only
  if (medium) {
    for (const channel of channels) {
      if (channel.disallowUtm) continue;
      
      const mediumRule = channel.rules.utm_medium;
      if (mediumRule?.allowedValues?.includes(medium)) {
        return channel.id;
      }
    }
  }

  // Default to first available channel
  const defaultChannel = channels.find(c => !c.disallowUtm);
  return defaultChannel?.id || null;
}

/**
 * Get the traffic type (paid/organic) from a channel ID
 */
export function getTrafficType(channelId: string): string {
  const channels = getChannels();
  const channel = channels.find(c => c.id === channelId);
  return channel?.trafficType || 'paid';
}
