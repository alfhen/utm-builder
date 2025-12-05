import type { ParsedUTMParams, ValidationMessage, ValidationResult, ChannelConfig, ParamRule } from './types';
import { getChannelById, getGlobalRules } from './rules';
import { isLowercase, hasSpaces } from './parser';

/**
 * Smart cleanup of UTM values:
 * - Transliterate special characters (ø→o, å→a, etc.)
 * - Replace spaces and dashes with underscores
 * - Collapse multiple underscores
 * - Lowercase everything
 */
function cleanUtmValue(value: string): string {
  const transliterations: Record<string, string> = {
    'ø': 'o', 'ö': 'o', 'ô': 'o', 'ò': 'o', 'ó': 'o', 'õ': 'o',
    'å': 'a', 'ä': 'a', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
    'æ': 'ae',
    'ü': 'u', 'ù': 'u', 'ú': 'u', 'û': 'u',
    'ë': 'e', 'è': 'e', 'é': 'e', 'ê': 'e',
    'ï': 'i', 'ì': 'i', 'í': 'i', 'î': 'i',
    'ÿ': 'y', 'ý': 'y',
    'ñ': 'n',
    'ç': 'c',
    'ß': 'ss',
  };
  
  let result = value.toLowerCase();
  
  for (const [from, to] of Object.entries(transliterations)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }
  
  result = result.replace(/[\s\-–—]+/g, '_');
  result = result.replace(/[^a-z0-9_]/g, '');
  result = result.replace(/_+/g, '_');
  result = result.replace(/^_+|_+$/g, '');
  
  return result;
}

/**
 * Check if a value matches the global allowed pattern
 */
function isValidUtmValue(value: string, allowKeywordMacro = false): boolean {
  if (!value) return false;
  
  let checkValue = value;
  if (allowKeywordMacro) {
    checkValue = value.replace(/\{keyword\}/g, 'keyword_placeholder');
  }
  
  const globalRules = getGlobalRules();
  const pattern = new RegExp(globalRules.allowedValuePattern);
  return pattern.test(checkValue);
}

/**
 * Validate UTM parameters against global and channel-specific rules
 */
export function validateUtmParams(
  params: ParsedUTMParams,
  channelId: string
): ValidationResult {
  const messages: ValidationMessage[] = [];
  const globalRules = getGlobalRules();
  const channel = getChannelById(channelId);

  if (!channel) {
    messages.push({
      type: 'error',
      message: `Unknown channel: ${channelId}`,
    });
    return {
      isValid: false,
      hasWarnings: false,
      messages,
      parsedParams: params,
    };
  }

  // Check if this channel disallows UTMs entirely
  if (channel.disallowUtm) {
    const hasAnyUtm = Object.values(params).some(v => v);
    if (hasAnyUtm) {
      messages.push({
        type: 'error',
        message: `${channel.label} should not use UTM parameters (organic traffic)`,
      });
    }
    return {
      isValid: messages.length === 0,
      hasWarnings: false,
      messages,
      parsedParams: params,
    };
  }

  // --- Global Rules ---
  
  // Check required parameters from global rules
  for (const param of globalRules.requiredParams) {
    const value = params[param as keyof ParsedUTMParams];
    if (!value || value.trim() === '') {
      messages.push({
        type: 'error',
        message: `Missing required parameter: ${param}`,
        suggestion: `Add ${param} to your URL`,
      });
    }
  }

  // Check all UTM values for global rules
  const allParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  
  for (const param of allParams) {
    const value = params[param];
    if (!value) continue;

    const paramRule = channel.rules[param];
    const allowKeywordMacro = paramRule?.allowKeywordMacro || false;
    const cleanedValue = cleanUtmValue(value);
    
    if (globalRules.disallowSpaces && hasSpaces(value)) {
      messages.push({
        type: 'error',
        message: `${param} contains spaces: "${value}"`,
        suggestion: `${param}=${cleanedValue}`,
      });
    } else if (globalRules.lowercaseOnly && !isLowercase(value)) {
      messages.push({
        type: 'error',
        message: `${param} must be lowercase: "${value}"`,
        suggestion: `${param}=${cleanedValue}`,
      });
    } else if (!isValidUtmValue(value, allowKeywordMacro)) {
      messages.push({
        type: 'error',
        message: `${param} contains invalid characters. Only a-z, 0-9, and underscores are allowed: "${value}"`,
        suggestion: `${param}=${cleanedValue}`,
      });
    }
  }

  // --- Channel-Specific Rules ---
  validateChannelRules(params, channel, messages);

  // Determine overall validity
  const errors = messages.filter((m) => m.type === 'error');
  const warnings = messages.filter((m) => m.type === 'warning');

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    messages,
    parsedParams: params,
  };
}

/**
 * Validate channel-specific rules
 */
function validateChannelRules(
  params: ParsedUTMParams,
  channel: ChannelConfig,
  messages: ValidationMessage[]
) {
  const rules = channel.rules;
  
  // Validate each parameter against its rules
  for (const [param, rule] of Object.entries(rules) as [keyof ParsedUTMParams, ParamRule][]) {
    if (!rule) continue;
    
    const value = params[param];
    
    // Check if parameter has allowed values
    if (value && rule.allowedValues && rule.allowedValues.length > 0) {
      if (!rule.allowedValues.includes(value)) {
        const suggestion = rule.preferredValue 
          ? `${param}=${rule.preferredValue}`
          : `${param}=${rule.allowedValues[0]}`;
        
        messages.push({
          type: 'error',
          message: `For ${channel.label}, ${param} must be "${rule.allowedValues.join('" or "')}", got "${value}"`,
          suggestion,
        });
      } else if (rule.warningIfNotPreferred && rule.preferredValue && value !== rule.preferredValue) {
        // Value is allowed but not preferred - show warning
        messages.push({
          type: 'warning',
          message: `Using "${value}" as ${param} is acceptable, but "${rule.preferredValue}" is preferred`,
          suggestion: `${param}=${rule.preferredValue}`,
        });
      }
    }
  }
}
