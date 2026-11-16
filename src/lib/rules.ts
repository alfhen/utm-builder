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
 * Get global rules
 */
export function getGlobalRules() {
  return config.globalRules;
}

